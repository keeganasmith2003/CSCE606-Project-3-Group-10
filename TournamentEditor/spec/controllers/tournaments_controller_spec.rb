require 'rails_helper'

RSpec.describe TournamentsController, type: :controller do
  describe 'GET #index' do
    context 'HTML request' do
      it 'returns a successful response' do
        get :index
        expect(response).to be_successful
      end

      it 'assigns @tournaments' do
        tournament1 = Tournament.create!(name: 'Tournament 1', mode: 'single')
        tournament2 = Tournament.create!(name: 'Tournament 2', mode: 'double')
        
        get :index
        expect(assigns(:tournaments)).to match_array([tournament1, tournament2])
      end

      it 'renders the index template' do
        get :index
        expect(response).to render_template(:index)
      end
    end

    context 'CSV request' do
      it 'returns CSV content type' do
        get :index, format: :csv
        expect(response.content_type).to eq('text/csv')
      end

      it 'includes CSV data' do
        Tournament.create!(name: 'Test Tournament', mode: 'single')
        get :index, format: :csv
        
        expect(response.body).to include('name,mode')
        expect(response.body).to include('Test Tournament,single')
      end

      it 'sets appropriate filename' do
        get :index, format: :csv
        expect(response.headers['Content-Disposition']).to include("tournament-#{Date.today}.csv")
      end
    end
  end

  describe 'POST #import' do
    let(:csv_file) { fixture_file_upload('tournaments.csv', 'text/csv') }

    before do
      # Create a temporary CSV file for testing
      File.write(Rails.root.join('spec', 'fixtures', 'tournaments.csv'), 
                 "name,mode\nImported Tournament,single_elimination")
    end

    after do
      File.delete(Rails.root.join('spec', 'fixtures', 'tournaments.csv')) if File.exist?(Rails.root.join('spec', 'fixtures', 'tournaments.csv'))
    end

    context 'with valid file' do
      it 'imports tournaments successfully' do
        expect {
          post :import, params: { file: csv_file }
        }.to change(Tournament, :count).by(1)
      end

      it 'redirects to root path' do
        post :import, params: { file: csv_file }
        expect(response).to redirect_to(root_path)
      end

      it 'sets success notice' do
        post :import, params: { file: csv_file }
        expect(flash[:notice]).to eq('Tournaments imported successfully!')
      end
    end

    context 'without file' do
      it 'does not import anything' do
        expect {
          post :import, params: { file: nil }
        }.not_to change(Tournament, :count)
      end

      it 'redirects to root path' do
        post :import, params: { file: nil }
        expect(response).to redirect_to(root_path)
      end

      it 'sets error alert' do
        post :import, params: { file: nil }
        expect(flash[:alert]).to eq('Please upload a CSV file.')
      end
    end
  end

  describe 'POST #update_bracket' do
    let(:valid_params) do
      {
        bracket_type: 'single_elimination',
        participants: ['Player1', 'Player2', 'Player3', 'Player4'],
        bracket_data: { stages: [], matches: [] },
        mode: 'draft'
      }
    end

    context 'with valid JSON request' do
      it 'returns successful JSON response' do
        post :update_bracket, params: valid_params, format: :json
        expect(response).to be_successful
      end

      it 'returns success message in JSON' do
        post :update_bracket, params: valid_params, format: :json
        json_response = JSON.parse(response.body)
        
        expect(json_response['success']).to be true
        expect(json_response['message']).to eq('Bracket data received successfully')
      end

      it 'includes timestamp in response' do
        post :update_bracket, params: valid_params, format: :json
        json_response = JSON.parse(response.body)
        
        expect(json_response['timestamp']).to be_present
      end

      it 'returns 200 status code' do
        post :update_bracket, params: valid_params, format: :json
        expect(response.status).to eq(200)
      end
    end

    context 'with minimal parameters' do
      it 'handles request without participants' do
        post :update_bracket, params: { bracket_type: 'single_elimination' }, format: :json
        expect(response).to be_successful
      end

      it 'handles request without bracket_data' do
        post :update_bracket, params: { bracket_type: 'single_elimination', participants: [] }, format: :json
        expect(response).to be_successful
      end
    end

    context 'with error' do
      before do
        allow(Rails.logger).to receive(:info).and_raise(StandardError.new('Test error'))
      end

      it 'returns error JSON response' do
        post :update_bracket, params: valid_params, format: :json
        json_response = JSON.parse(response.body)
        
        expect(json_response['success']).to be false
        expect(json_response['error']).to be_present
      end

      it 'returns 422 status code on error' do
        post :update_bracket, params: valid_params, format: :json
        expect(response.status).to eq(422)
      end
    end
  end
end