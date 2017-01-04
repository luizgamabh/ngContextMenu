;(function (window, document, undefined) {
  'use strict';
  angular.module('ngContextMenu', [])
    .provider('contextMenuConfig', contextMenuConfigProvider)
    .directive('contextMenu', contextMenu);

  function contextMenuConfigProvider() {
    this.config = {
      cssClassPrefix: 'ng-context-menu',
      cssIconPrefix: 'icon-',
      iconPrefixed: false,
      enableDropDown: false
    };
    this.$get = function() {
      return this.config;
    };
  }

  // Variables to contextmenu construction
  var ngContextMenu__CM = null, ngContextMenu__DD = null;

  contextMenu.$inject = ['$rootScope', 'contextMenuConfig'];

  function contextMenu($rootScope, contextMenuConfig) {
    return {
      restrict: 'A',
      scope: {
        contextMenu: '&',
        contextMenuPromise: '='
      },
      link: function ($scope, element, attrs) {

        var menu = {};

        // Options
        var cssClassPrefix = contextMenuConfig.cssClassPrefix.replace(/_+$/g, '');
        var iconPrefixed = !!contextMenuConfig.iconPrefixed;
        var enabledDropdown = !!contextMenuConfig.enableDropDown;

        // Target element
        var elem = element[0];

        // Creates dropdown according to setup
        if (enabledDropdown) {
          createDropDown(ngContextMenu__DD, elem, cssClassPrefix);
        }

        // Events to destroy context menu
        elem.addEventListener('mousedown', function() {
          event.stopPropagation();
          console.info(ngContextMenu__CM);
          if (ngContextMenu__CM) {
            destroyAllMenus();
          }
          elem.addEventListener('mouseup', contextMenuHandler);
        });

        function contextMenuHandler(event) {
          event.stopPropagation();
          this.removeEventListener('mouseup', contextMenuHandler); // arguments.callee can't be used in strict mode
          if (event.button == 2) {
            document.documentElement.addEventListener('mousedown', destroyContextMenu);
            generateAndOpenMenu(event);
          }
        }

        // Events to create and show context menu
        // elem.addEventListener('mousedown', contextHandler);
        elem.addEventListener('contextmenu', function(event) {
          event.preventDefault(); // Prevents from opening browser default context menu
        });

        function destroyContextMenu(event) {
          document.documentElement.removeEventListener('mousedown', destroyContextMenu);
          console.debug('f__destroyContextMenu', $scope.$id);
          console.info(ngContextMenu__CM);
          if (ngContextMenu__CM) {
            destroyAllMenus();
          }
        }

        function createDropDown(dd, element, prefix) {
          console.debug('f__createDropDown');
          dd = document.createElement('a');
          dd.setAttribute('href', '');
          dd.classList.add(prefix + '__circle');
          var arrow = document.createElement('div');
          arrow.classList.add(prefix + '__arrow');
          arrow.textContent = 'L';
          dd.appendChild(arrow);
          element.appendChild(dd);
          element.classList.add(prefix + '__wrapper');
        }

        function destroyAllMenus() {
          console.debug('f__destroyAllMenus');
          ngContextMenu__CM.removeEventListener('mousedown', stopPropagation);
          console.warn(ngContextMenu__CM);
          if (ngContextMenu__CM) {
            ngContextMenu__CM.removeEventListener('mousedown', stopPropagation);
            ngContextMenu__CM.removeEventListener('contextmenu', preventDefault);
            // Todo: Remove events for ngContextMenu__CM.children[0].children;
            ngContextMenu__CM.parentNode.removeChild(ngContextMenu__CM);
            ngContextMenu__CM = null;
          }
        }

        function generateAndOpenMenu(event) {
          console.debug('f__generateAndOpenMenu');
          ngContextMenu__CM = document.createElement('div');
          ngContextMenu__CM.classList.add(cssClassPrefix + '__menu');
          ngContextMenu__CM.addEventListener('mousedown', stopPropagation);
          ngContextMenu__CM.addEventListener('contextmenu', preventDefault);
          if ($scope.$$phase || $rootScope.$$phase) {
            if ($scope.contextMenuPromise) {
              $scope.contextMenu().then(function(res) {
                menu = res;
                return mountMenu(event);
              });
              return;
            } else {
              menu = $scope.contextMenu();
            }
          } else {
            if ($scope.contextMenuPromise) {
              $scope.$apply($scope.contextMenu).then(function(res) {
                menu = res;
                return mountMenu(event);
              });
              return;
            } else {
              menu = $scope.$apply($scope.contextMenu);
            }
            return mountMenu(event);
          }
        }

        function mountMenu(event) {
          var ul = document.createElement('ul');
          for (var i in menu) {
            if (menu[i].text == undefined && menu[i].icon == undefined) {
              // It is a separator
              var li = document.createElement('li');
              li.classList.add(cssClassPrefix + '__separator');
              var div_empty = document.createElement('div');
              div_empty.textContent = '&nbsp;';
              li.appendChild(div_empty);
              ul.appendChild(li);
            } else {
              // It is a menu item:
              // Do not include the item if condition is false
              if (angular.isDefined(menu[i].condition) && menu[i].condition === false) continue;
              menu[i].text = menu[i].text || '';
              var icon = document.createElement('span');
              var icon_class = iconPrefixed ? cssClassPrefix + '__icon' : 'icon';
              icon.classList.add(icon_class);
              if (menu[i].icon != undefined) {
                icon.classList.add(icon_class + '-' + menu[i].icon);
              }
              var listItem = document.createElement('li');
              listItem.appendChild(icon);
              var value = document.createElement('div');
              value.classList.add(cssClassPrefix + '__text');
              value.textContent = menu[i].text;
              listItem.appendChild(value);

              if (menu[i].callback != undefined && typeof menu[i].callback === 'function') {
                listItem.addEventListener('mousedown', function callee(event) {
                  if (event.button !== 0) { // Not left click
                    event.stopPropagation();
                  } else if (event.button === 0) { // Left click
                    // Executes callback
                    menu[i].callback.call(this);
                    listItem.removeEventListener('mousedown', callee);
                    destroyAllMenus();
                  }
                });
              }
            }
            // Add this item to menu list
            ul.appendChild(listItem);
          }

          ngContextMenu__CM.appendChild(ul);
          document.body.appendChild(ngContextMenu__CM);

          showMenu(event);
        }

        function showMenu(event) {
          var offset = 50;
          var x = event.pageX || event.clientX;
          var y = event.pageY || event.clientY;
          var width = ngContextMenu__CM.getBoundingClientRect().width;
          var height = ngContextMenu__CM.getBoundingClientRect().height;
          var docEl = window.document.documentElement.getBoundingClientRect();
          var docEl_width = docEl.width;
          var docEl_height = docEl.height;
          x = (x + width > (docEl_width - offset)) ? x - width : x;
          y = (y + height > (docEl_height - offset)) ? y - height : y;
          ngContextMenu__CM.style.top = y + 'px';
          ngContextMenu__CM.style.left = x + 'px';
          ngContextMenu__CM.classList.add('fade-in');
        }
      }
    }
  }

  function stopPropagation(event) {
    console.debug('f__stopPropagation');
    event.stopPropagation();
  }

  function preventDefault(event) {
    console.debug('f__preventDefault');
    event.preventDefault();
  }
})(window, document, undefined);
