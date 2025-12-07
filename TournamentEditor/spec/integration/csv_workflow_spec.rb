require 'rails_helper'

RSpec.describe 'CSV Import/Export Workflow', type: :request do
  let(:csv_content) { "name,mode\nTest Tournament,single_elimination\nAnother Tournament,double_elimination" }
  let(:csv_file) { Tempfile.new(['test', '.csv']) }

  before do
    csv_file.write(csv_content)
    csv_file.rewind
  end

  after do
    csv_file.unlink
  end

  it 'completes full import and export cycle' do
    # Import
    post import_tournaments_path, params: { 
      file: fixture_file_upload(csv_file.path, 'text/csv') 
    }
    expect(Tournament.count).to eq(2)

    # Export
    get tournaments_path(format: :csv)
    expect(response.body).to include('Test Tournament')
    expect(response.body).to include('single_elimination')
  end
end
