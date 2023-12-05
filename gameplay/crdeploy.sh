PROJECT_ID=$(gcloud config get-value project)
JOB=fwl-calculate-scores
IMAGE=gcr.io/$PROJECT_ID/$JOB


gcloud builds submit --pack image=$IMAGE .
gcloud run jobs deploy $JOB --image $IMAGE --set-env-vars API_URL=https://fwlapi.newmexicowaterdata.org --region us-west4