require 'rails_helper'

RSpec.describe 'routes', type: :routing do
  describe 'root route' do
    it 'routes to application#index' do
      expect(get: '/').to route_to('application#index')
    end
  end

  describe 'style route' do
    it 'routes to style#index' do
      expect(get: '/style').to route_to('style#index')
    end
  end

  describe 'tournaments routes' do
    it 'routes to tournaments#index' do
      expect(get: '/tournaments').to route_to('tournaments#index')
    end

    it 'routes POST /tournaments/import to tournaments#import' do
      expect(post: '/tournaments/import').to route_to('tournaments#import')
    end

    it 'routes POST /tournaments/update_bracket to tournaments#update_bracket' do
      expect(post: '/tournaments/update_bracket').to route_to('tournaments#update_bracket')
    end
  end
end
