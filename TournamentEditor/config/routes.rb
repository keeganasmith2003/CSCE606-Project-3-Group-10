Rails.application.routes.draw do
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html

  root 'application#index'

  # Style Guide route
  get 'style', to: 'style#index'
  resources :tournaments do
    collection do
      post :import
      post :update_bracket
    end
  end
end
