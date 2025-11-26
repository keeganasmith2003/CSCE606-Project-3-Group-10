class TournamentsController < ApplicationController
  def index
    @tournaments = Tournament.all

    respond_to do |format|
      format.html
      format.csv { send_data @tournaments.to_csv, filename: "tournament-#{Date.today}.csv" }
    end
  end

  def import
    if params[:file].present?
      Tournament.import(params[:file])
      redirect_to root_path, notice: "Tournaments imported successfully!"
    else
      redirect_to root_path, alert: "Please upload a CSV file."
    end
  end
end
