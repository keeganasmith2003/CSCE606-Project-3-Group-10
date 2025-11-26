class ApplicationController < ActionController::Base
  def index
    @users = User.all

    respond_to do |format|
      format.html
      format.csv { send_data @users.to_csv, filename: "tournament-#{Date.today}.csv" }
    end
  end
end
