'use strict';

function selectText(element) {
  var doc = document;
  if (doc.body.createTextRange) { // ms
    var range = doc.body.createTextRange();
    range.moveToElementText(element);
    range.select();
  } else if (window.getSelection) {
    var selection = window.getSelection();
    var range = doc.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);

  }
}
angular.module('copayApp.directives')
.directive('validAddress', ['$rootScope', 'profileService',
    function($rootScope, profileService) {
      return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
          var ValidationUtils = require('byteballcore/validation_utils.js');
          var validator = function(value) {
            if (!profileService.focusedClient)
              return;
			  
            if (typeof value == 'undefined') {
              ctrl.$pristine = true;
              return;
            }

            // Regular url
            if (/^https?:\/\//.test(value)) {
              ctrl.$setValidity('validAddress', true);
              return value;
            }

            // byteball uri
			var conf = require('byteballcore/conf.js');
			var re = new RegExp('^'+conf.program+':([A-Z2-7]{32})\b', 'i');
			var arrMatches = value.match(re);
            if (arrMatches) {
              ctrl.$setValidity('validAddress', ValidationUtils.isValidAddress(arrMatches[1]));
              return value;
            }

            // Regular Address
            ctrl.$setValidity('validAddress', ValidationUtils.isValidAddress(value));
            return value;
          };

          ctrl.$parsers.unshift(validator);
          ctrl.$formatters.unshift(validator);
        }
      };
    }
  ])
  .directive('validUrl', [

    function() {
      return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
          var validator = function(value) {
            // Regular url
            if (/^https?:\/\//.test(value)) {
              ctrl.$setValidity('validUrl', true);
              return value;
            } else {
              ctrl.$setValidity('validUrl', false);
              return value;
            }
          };

          ctrl.$parsers.unshift(validator);
          ctrl.$formatters.unshift(validator);
        }
      };
    }
  ])
  .directive('validAmount', ['configService',
    function(configService) {

      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          var val = function(value) {
			//console.log('-- scope', ctrl);
			/*if (scope.home && scope.home.bSendAll){
				console.log('-- send all');
				ctrl.$setValidity('validAmount', true);
				return value;
			}*/
			//console.log('-- amount');
            var settings = configService.getSync().wallet.settings;
            var vNum = Number((value * settings.unitToBytes).toFixed(0));

            if (typeof value == 'undefined' || value == 0) {
              ctrl.$pristine = true;
            }

            if (typeof vNum == "number" && vNum > 0) {
              var decimals = Number(settings.unitDecimals);
              var sep_index = ('' + value).indexOf('.');
              var str_value = ('' + value).substring(sep_index + 1);
              if (sep_index > 0 && str_value.length > decimals) {
                ctrl.$setValidity('validAmount', false);
              } else {
                ctrl.$setValidity('validAmount', true);
              }
            } else {
              ctrl.$setValidity('validAmount', false);
            }
            return value;
          }
          ctrl.$parsers.unshift(val);
          ctrl.$formatters.unshift(val);
        }
      };
    }
  ])
  .directive('loading', function() {
    return {
      restrict: 'A',
      link: function($scope, element, attr) {
        var a = element.html();
        var text = attr.loading;
        element.on('click', function() {
          element.html('<i class="size-21 fi-bitcoin-circle icon-rotate spinner"></i> ' + text + '...');
        });
        $scope.$watch('loading', function(val) {
          if (!val) {
            element.html(a);
          }
        });
      }
    }
  })
  .directive('ngFileSelect', function() {
    return {
      link: function($scope, el) {
        el.bind('change', function(e) {
          $scope.file = (e.srcElement || e.target).files[0];
          $scope.getFile();
        });
      }
    }
  })
  .directive('contact', ['addressbookService', function(addressbookService) {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
        var addr = attrs.address;
        addressbookService.getLabel(addr, function(label) {
          if (label) {
            element.append(label);
          } else {
            element.append(addr);
          }
        });
      }
    };
  }])
  .directive('highlightOnChange', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        scope.$watch(attrs.highlightOnChange, function(newValue, oldValue) {
          element.addClass('highlight');
          setTimeout(function() {
            element.removeClass('highlight');
          }, 500);
        });
      }
    }
  })
  .directive('checkStrength', function() {
    return {
      replace: false,
      restrict: 'EACM',
      require: 'ngModel',
      link: function(scope, element, attrs) {

        var MIN_LENGTH = 8;
        var MESSAGES = ['Very Weak', 'Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
        var COLOR = ['#dd514c', '#dd514c', '#faa732', '#faa732', '#16A085', '#16A085'];

        function evaluateMeter(password) {
          var passwordStrength = 0;
          var text;
          if (password.length > 0) passwordStrength = 1;
          if (password.length >= MIN_LENGTH) {
            if ((password.match(/[a-z]/)) && (password.match(/[A-Z]/))) {
              passwordStrength++;
            } else {
              text = ', add mixed case';
            }
            if (password.match(/\d+/)) {
              passwordStrength++;
            } else {
              if (!text) text = ', add numerals';
            }
            if (password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/)) {
              passwordStrength++;
            } else {
              if (!text) text = ', add punctuation';
            }
            if (password.length > 12) {
              passwordStrength++;
            } else {
              if (!text) text = ', add characters';
            }
          } else {
            text = ', that\'s short';
          }
          if (!text) text = '';

          return {
            strength: passwordStrength,
            message: MESSAGES[passwordStrength] + text,
            color: COLOR[passwordStrength]
          }
        }

        scope.$watch(attrs.ngModel, function(newValue, oldValue) {
          if (newValue && newValue !== '') {
            var info = evaluateMeter(newValue);
            scope[attrs.checkStrength] = info;
          }
        });
      }
    };
  })
  .directive('showFocus', function($timeout) {
    return function(scope, element, attrs) {
      scope.$watch(attrs.showFocus,
        function(newValue) {
          $timeout(function() {
            newValue && element[0].focus();
          });
        }, true);
    };
  })
  .directive('match', function() {
    return {
      require: 'ngModel',
      restrict: 'A',
      scope: {
        match: '='
      },
      link: function(scope, elem, attrs, ctrl) {
        scope.$watch(function() {
          return (ctrl.$pristine && angular.isUndefined(ctrl.$modelValue)) || scope.match === ctrl.$modelValue;
        }, function(currentValue) {
          ctrl.$setValidity('match', currentValue);
        });
      }
    };
  })
  .directive('clipCopy', function() {
    return {
      restrict: 'A',
      scope: {
        clipCopy: '=clipCopy'
      },
      link: function(scope, elm) {
        // TODO this does not work (FIXME)
        elm.attr('tooltip', 'Press Ctrl+C to Copy');
        elm.attr('tooltip-placement', 'top');

        elm.bind('click', function() {
          selectText(elm[0]);
        });
      }
    };
  })
  .directive('menuToggle', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/includes/menu-toggle.html'
    }
  })
  .directive('logo', function() {
    return {
      restrict: 'E',
      scope: {
        width: "@",
        negative: "="
      },
      controller: function($scope) {
        //$scope.logo_url = $scope.negative ? 'img/logo-negative.svg' : 'img/logo.svg';
        $scope.logo_url = $scope.negative ? 'img/icons/icon-white-32.png' : 'img/icons/icon-black-32.png';
      },
      replace: true,
      //template: '<img ng-src="{{ logo_url }}" alt="Byteball">'
      template: '<div><img ng-src="{{ logo_url }}" alt="Byteball"><br>Byteball</div>'
    }
  })
  .directive('availableBalance', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/includes/available-balance.html'
    }
  });
