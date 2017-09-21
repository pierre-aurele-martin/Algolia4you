# Algolia4You

# Goal 
Allow some e-commerce owner who wants to try Algolia without anything to code to actually do that.

# How it works
  1 - Simply go to [pamart.in/Algolia4you/](http://pamart.in/Algolia4you/)
  2 - Put your e-commerce CMS in the input
  3 - Let the magic happen

# Limitation
For now it only works with Woocomerce (YEAST SEO installed) and Shopify. Prestashop should arrive
Limit for each site is 500 objects as the app on my site is plugged to a Community plan

# Installation
If you want plug your own accound to use this tools, you'll simple have to change the API key :
 * One back/secret_key.php defining : $GLOBALS['MASTER_KEY'] = [your-write-key];
 * AppID in app.js const appId = '[your-app-id]';
 * apiKey in app.js const apiKey = '[your-api-READ-ONLY]';

!!!Never put your Admin API Key in a front Javascript file!!!

#Left to do :

* Listen and adapt to your feedback
* Fine tunes the indices
* Add a debug mode
* Add a more visual progress bar
* Update Algolia libraries
* Add a function to compare with native search
* Add Color, Size etc. in Object
* Add more CMS
* Remove first level of categories when generic (shops, collections etc...)
* Lite version of the repo

* Sky is the limit...

I'll create github issues to details those.

#Disclaimer

I code for fun and this was made to show Algolia my <3 !

