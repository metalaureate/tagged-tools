var app;
app = angular.module('app', ['ui.router','ui.bootstrap', 'akoenig.deckgrid']);

app.config(function ($stateProvider, $locationProvider) {
    $locationProvider.html5Mode({enabled: true, requireBase: false});
    $stateProvider
        .state('profiles', {
            resolve: {},
            url: '/:shortlink',
            templateUrl: '/templates/profiles.html',
            controller: 'ProfilesCtrl'
        });
});


app.controller('ProfilesCtrl', function ($scope, $http, $log,$state,$stateParams,$window) {
    $scope.uids='';
    $scope.users=[];
    $scope.host=$window.location.host;

    var shortlink=$stateParams.shortlink;

    if (shortlink>'') {
        $scope.shortlink=shortlink;

        $log.info(shortlink);
        $http.get('/api/v1/read/', {json: true, params: {shortlink: shortlink}}
        ).success(function (data) {
                $scope.uids=data.data;

            }).error(function () {

                $log.error("Error getting saved query.");
            });

    }

    $scope.visualize=function() {
        var uids=$scope.uids.split('\n');
        if ($scope.uids.match(/\,/ig)) {
           uids= $scope.uids.split(',');
           uids= _.map(uids, function (m) { return m.replace(/\,/ig,'')});
        }
        $scope.users= _.map(uids, function (m) { return {title: m, src: "http://www.tagged.com/imgsrv.php?sz=p&uid="+m}});
        $log.info($scope.users);
        $http.post('/api/v1/save/', {data: $scope.uids}, {json: true}
        ).success(function (data) {
                $log.debug(data);
                $scope.shortlink=data.shortlink;
            }).error(function () {
                $log.error("Error saving.");
            });
    }

});




app.directive('imageloaded', [

    function () {

        'use strict';

        return {
            restrict: 'A',

            link: function (scope, element, attrs) {
                var cssClass = attrs.loadedclass;

                element.bind('load', function (e) {
                    angular.element(element).addClass(cssClass);
                });
            }
        }
    }
]);