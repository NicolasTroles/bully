var myApp = angular.module('myApp',[]);

myApp.controller('cont', function($scope, $http) {
	$scope.comprar = function(){
       $http.get("http://localhost:3004/compra/" + $scope.idCompra)
	    .then(function(response) {
	       alert(response.data);
	       $scope.idCompra = null;
	    });
	};

	$scope.procura = function(){
       $http.get("http://localhost:3004/procura/" + $scope.produtoProcura)
	    .then(function(response) {
	       alert(response.data);
	       $scope.produtoProcura = null;
	    });
	};

	$scope.detalhe = function(){
       $http.get("http://localhost:3004/detalhes/" + $scope.idProcura)
	    .then(function(response) {
	       alert(response.data);
	       $scope.idProcura = null;
	    });
	};

});