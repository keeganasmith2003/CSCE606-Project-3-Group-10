require 'rails_helper'

RSpec.describe Tournament, type: :model do
  describe 'CSV operations' do
    it 'converts tournaments to CSV format' do
      Tournament.create!(name: 'Test Tournament', mode: 'single_elimination')
      csv = Tournament.to_csv
      
      expect(csv).to include('Test Tournament')
      expect(csv).to include('single_elimination')
    end

    it 'imports tournaments from CSV' do
      file_path = Rails.root.join('spec', 'fixtures', 'files', 'tournaments.csv')
      
      # Create a temporary CSV file for testing
      CSV.open(file_path, 'w', headers: true) do |csv|
        csv << ['name', 'mode']
        csv << ['Import Test', 'single_elimination']
      end

      expect {
        Tournament.import(double(path: file_path))
      }.to change { Tournament.count }.by(1)

      tournament = Tournament.find_by(name: 'Import Test')
      expect(tournament).not_to be_nil
      expect(tournament.mode).to eq('single_elimination')

      # Cleanup
      File.delete(file_path) if File.exist?(file_path)
    end
  end

  describe 'validations' do
    it 'creates a valid tournament' do
      tournament = Tournament.new(name: 'Valid Tournament', mode: 'single_elimination')
      expect(tournament).to be_valid
    end
  end
end

