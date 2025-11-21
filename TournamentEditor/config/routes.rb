Rails.application.routes.draw do
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html

  # TODO: Replace this route with the actual root
  root 'style#index'

  # Style Guide route
  get 'style', to: 'style#index'
end
