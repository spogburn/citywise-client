app.service('addPhotoService', ['$cordovaCamera', '$http', function($cordovaCamera, $http) {

  var sv = this;
  sv.url = '' ;
  sv.photo = {};

  //this method will open the camera app. It returns a promise with the data being the base64 encoded image
  sv.takePicture = function() {
    var options = {
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      encodingType: Camera.EncodingType.JPEG,
      allowEdit: 1,
      saveToPhotoAlbum: true,
	    correctOrientation: true
    };
    return $cordovaCamera.getPicture(options)
    .then(function(pictureData){
      sv.photo.taken = true;
      sv.photo.data = 'data:image/jpeg;base64,' + pictureData;
     return 'data:image/jpeg;base64, ' + pictureData;
  });
}

sv.addPicture = function() {
  var options = {
    destinationType: Camera.DestinationType.DATA_URL,
    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
    encodingType: Camera.EncodingType.JPEG,
    allowEdit: 1,
    correctOrientation: true
  };
  return $cordovaCamera.getPicture(options)
  .then(function(pictureData){
    sv.photo.taken = true;
    sv.photo.data = 'data:image/jpeg;base64,' + pictureData;
   return 'data:image/jpeg;base64, ' + pictureData;
});
}
  //this method uploads the image passed into it as base64 and returns a promise where the data is an object of information about the image. the url can be accessed at data.data.secure_url
  sv.uploadPicture = function(imageInfo) {
    return $http.post('https://api.cloudinary.com/v1_1/spogburn/auto/upload', {
        file: imageInfo,
        upload_preset: 'zt4pq0pu'
      })
      .then(function(data) {
        return data.data.secure_url;
      })
      .catch(function(err){
        return err;
      });
  };

}])

app.service('addMapService', ['$cordovaGeolocation', '$ionicPopup', '$ionicGesture', function($cordovaGeolocation, $ionicPopup, $ionicGesture){
  var sv = this;
  sv.map = {};
  sv.lat = '';
  sv.long = '';
  var posOptions = {timeout: 20000, enableHighAccuracy: false};

  // checks if user has location services enabled
   sv.checkLocationService = function(){
     cordova.plugins.diagnostic.isLocationEnabled(
        function(e) {
          console.log('e', e);
            if (e){
              console.log('location is enabled');
            }
            else {
              $ionicPopup.alert({
                title: 'Error getting location',
                content: 'CityWise needs you to enable location services. Otherwise you won\'t be able to notify your city of problems.',
                buttons: [{text: 'Okay',type: 'button-energized'}]
              }).then(function(res) {
                console.log('Location Not Turned ON');
                cordova.plugins.diagnostic.switchToLocationSettings();
              });
            }
           },
       function(e) {
           alert('Error ' + e );
       });
   }


    sv.getMap = function(){
      $cordovaGeolocation.getCurrentPosition(posOptions)
      .then(function(position){
       if (sv.lat !== '' && sv.long !== ''){
        positionNow = new google.maps.LatLng(sv.lat, sv.long);
       } else {
         sv.lat = position.coords.latitude;
         sv.long = position.coords.longitude
        positionNow = new google.maps.LatLng(sv.lat, sv.long);
        }

        reverseGeocode(sv.lat, sv.long);

      var mapOptions = {
          center: positionNow,
          zoom: 15,
          draggable: true,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };

      sv.map = new google.maps.Map(document.getElementById("map"), mapOptions)

      // console.log('sv.map', sv.map);
      var image = {
        path: 'M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z',
       fillColor: '#ffc900',
       fillOpacity: 0.8,
       scale: 1,
       strokeColor: '#444',
       strokeWeight: 6
       }

      // makes a marker
        var marker = new google.maps.Marker({
          position: positionNow,
          title: "Pinpoint your WiseUp!",
          draggable: true,
          animation: google.maps.Animation.DROP,
          icon: image
        });

      // sv.map.$ionicGesture.on('hold', function(e){
      //   console.log('e', e);
      //   console.log(e).getPosition().lat();
      // })

      sv.map.addListener('click', function(e){
        console.log('click e', e);
        var clickLat = e.latLng.lat()
        var clickLong = e.latLng.lng()
        marker.setPosition(new google.maps.LatLng(clickLat, clickLong));
        marker.setMap(sv.map);
        sv.map.setCenter(marker.getPosition())
      })
      // Adds the marker to the map;


      // listens for the lat/long of the marker
        marker.addListener('dragend', function(){
          sv.lat = marker.getPosition().lat();
          sv.long = marker.getPosition().lng();
          sv.map.setCenter(marker.getPosition());
          console.log('lat:', sv.lat);
          console.log('long:', sv.long);
          reverseGeocode();
        })

        // listens for the lat/long of the marker
          // marker.addListener('mouseup', function(){
          //   sv.lat = marker.getPosition().lat();
          //   sv.long = marker.getPosition().lng();
          //   sv.map.setCenter(marker.getPosition());
          //   console.log('lat:', sv.lat);
          //   console.log('long:', sv.long);
          //   reverseGeocode();
          // })

        sv.map.addListener('dragend', function(){
          marker.setPosition(sv.map.getCenter())
        })
        //
        // sv.map.addListener('click', function(){
        //   marker.setPosition(sv.map.getCenter())
        // })


     }).catch(function(err){
        console.log('error with getting location', err);
     });
   }

      // this function reverse geocodes to get city and state name
      function reverseGeocode(lat, long){

        var geocoder = new google.maps.Geocoder;

        var latlng = {lat: lat, lng: long}

        geocoder.geocode({'location': latlng}, function(results, status){
          if (status === 'OK'){
            if (results[0]){
              // console.log(results[0]);
              var results = results[0].formatted_address;
              // this gets the name of the city
              sv.cityName = results.split(', ')[1];
              // this gets the state two letter abbr
              sv.stateAbbr = results.split(', ')[2].substring(0,2);
            }  else {
              console.log('no geocoder results found');
            }
          } else {
            console.log('status for geocoder not ok', status);
          }
        })
      }
}])

// service that holds form values from various controllers
app.service('formService', ['$http', function($http){
 var sv = this;
 sv.issue = {};
 sv.error = {};

 sv.issue.type = 'roads';

// cancel modal clear text
 sv.cancel = function(){
   sv.issue.txt = '';
   sv.issue.show = false;
   console.log(sv.issue);
 }

 // update from page 3
 sv.update = function(text){
   sv.issue.show = true;
   sv.issue.txt = text;
   if (sv.issue.txt === '') {
     sv.issue.show = false;
   }
   sv.error.show = false;
 }

}])

// service to send form to server endpoint
app.service('submitService', ['$http', '$window','addMapService', 'addPhotoService', 'formService', '$ionicLoading', '$state', 'production', function($http, $window, ams, aps, formService, $ionicLoading, $state, production){
  var sv = this;
  var url = '';
  var cityWiseSubmit = {};

  sv.submit = function(){
    console.log(production.apiUrl);
    // if they haven't added the right things, they get an error and nothing happens
    if(formService.issue.txt === undefined || formService.issue.txt === ''){
      console.log('you need to add txt!');
      formService.error.show = true;
    } else {
      // toggles photo view
      $ionicLoading.show({
        templateUrl: './templates/sending.html'
      })
      aps.photo.taken = false;

      aps.uploadPicture(aps.photo.data)
      .then(function(data){
        url = data;
        if (data.status === 400){
          url = 'https://placehold.it/200x200'
        }
          cityWiseSubmit = {
          city: ams.cityName,
          state: ams.stateAbbr,
          category: formService.issue.type,
          issue: formService.issue.txt,
          photo_url: url,
          user_email: $window.localStorage.email,
          lat: ams.lat,
          long: ams.long
        };
        formService.issue.txt = '';
        formService.issue.show = false;
        console.log('cityWiseSubmit', JSON.stringify(cityWiseSubmit));
      })
      .then(function(){
        return $http.post(production.apiUrl + 'api/city-wise', cityWiseSubmit)
      })
      .then(function(response){
        console.log('response!', response);
        if(response.status === 200){
          $ionicLoading.hide();
          $state.go('success');
        } else {
          console.log(JSON.stringify(response));
          $ionicLoading.hide();
          $state.go('failure');
          // run a funcion to show the user the request was not successul
        }
      })
      .catch(function(err){
        console.log('catch error', JSON.stringify(err));
        $ionicLoading.hide();
        $state.go('failure');
      });
    }
  }


}])
