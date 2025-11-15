# Dropheus Backend

This is the backend for Dropheus, which is a chrome extension that allows you to select an etsy or amazon item and check if there are matching items on AliExpress, to detect dropshipping. 

The backend takes in requests at /search?q=searchTerm and will return the first 3 results from aliexpress, with their urls, prices, and images. This is used by the Dropheus chrome extension to check if there are matching items on AliExpress for an Etsy or Amazon item.

The backend caches all results so any repeat search query will be pulled from cache instead of making a new aliexpress api request. 

## Setup
~~~
git clone https://github.com/Charmunks/dropheus-backend
cp example.env .env
# add api keys from https://rapidapi.com/ecommdatahub/api/aliexpress-datahub/ to .env
npm install
npm run dev
~~~