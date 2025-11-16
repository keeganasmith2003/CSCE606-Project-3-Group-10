class CreateMatches < ActiveRecord::Migration[6.1]
  def change
    create_table :matches do |t|
      t.string :competitors
      t.string :winner
      t.string :mode

      t.timestamps
    end
  end
end
