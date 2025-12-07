require 'rails_helper'

RSpec.describe ApplicationRecord, type: :model do
  it 'is an abstract class' do
    expect(ApplicationRecord.abstract_class).to be true
  end

  it 'inherits from ActiveRecord::Base' do
    expect(ApplicationRecord.superclass).to eq(ActiveRecord::Base)
  end

  it 'cannot be instantiated directly' do
    expect { ApplicationRecord.new }.to raise_error(NotImplementedError)
  end
end
