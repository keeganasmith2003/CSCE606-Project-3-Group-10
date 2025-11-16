class CreateCompetitors < ActiveRecord::Migration[6.1]
  def change
    create_table :competitors do |t|
      t.string :name
      t.string :wins
      t.string :loses

      t.timestamps
    end
  end
end
