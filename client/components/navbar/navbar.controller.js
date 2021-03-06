'use strict';

angular.module('webrtcTestApp')
  .controller('NavbarCtrl', function ($scope, $location) {
    $scope.menu = [
    /*{
      'title': 'Home',
      'link': '/'
    },
    */
    {
      'title': 'Game',
      'link': '#/game',
      'name':'main.game'
    },
    { 
      'title': 'Demo',
      'link': '#/demo',
      'name':'main.demo'
    }

    ];

    $scope.isCollapsed = true;

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });