var app;
app = angular.module('app',
    ['ui.bootstrap', 'geolocation','uiGmapgoogle-maps']);
app.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        //    key: 'your api key',
        v: '3.17',
        libraries: 'weather,geometry,visualization'
    });
})
app.controller('SearchCtrl', function (geolocation,$scope,$http,$log) {
    $scope.geoloading=true;
    $scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 8 };
    $scope.lang="en";
    geolocation.getLocation().then(function (data) {
        $scope.geoloading=false;
        $scope.lat=data.coords.latitude;
        $scope.long=data.coords.longitude;
        $scope.map = { center: { latitude: $scope.lat, longitude: $scope.long }, zoom: 8 };

    })
    $scope.getPlaces = function (val) {

        return $http.get('/api/v1/search/', {
            params: {
                search: val,
                lat: $scope.lat,
                long: $scope.long,
                lang: $scope.lang
            }
        }).then(function (res) {
            var places= _.map(res.data.places, function (p) { return {city: p.properties.city || p.properties.name,
                state: p.properties.state,
                country: p.properties.country,
                lat: p.geometry.coordinates[1], long:p.geometry.coordinates[0] }})
            $log.info(res.data.data);
            return places;
        });
    };
    $scope.mapPlace = function (item, model, label) {
        console.log(item);
        $scope.map = { center: { latitude: item.lat, longitude: item.long }, zoom: 8 };
        $scope.place=item.city +", "+item.state;

    }
});
