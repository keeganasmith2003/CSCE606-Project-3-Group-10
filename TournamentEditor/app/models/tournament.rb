require 'csv'

class Tournament < ApplicationRecord
  def self.to_csv
    attributes = %w{name mode}

   CSV.generate(headers: true) do |csv|
      csv << attributes
      all.find_each do |tournament|
        csv << attributes.map { |attr| tournament.send(attr) }
      end
    end
  end

  def self.import(file)
    CSV.foreach(file.path, headers: true) do |row|
      tournament_hash = row.to_hash
      tournament = Tournament.find_or_initialize_by(name: tournament_hash["name"])
      tournament.update(tournament_hash)
    end
  end
end
