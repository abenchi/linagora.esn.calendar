(function() {
  'use strict';

  /**
   * There are 3 types of form in the module:
   *   * The quick form: this is a desktop only view of an edition form for events.
   *   * The full form: this is a desktop and mobile view of an complete edition form for events.
   *   * The consult form: this is a desktop and mobile view of an consult form for events.
   * Note that mobile devices have only access to the full form and the consult form.
   * This service will open the correct form corresponding to the event and the screen size.
   */
  angular.module('esn.calendar')
         .factory('calOpenEventForm', calOpenEventForm);

  calOpenEventForm.$inject = [
    '$modal',
    '$state',
    'screenSize',
    'calendarService',
    'calEventUtils'
  ];

  function calOpenEventForm($modal, $state, screenSize, calendarService, calEventUtils) {

    return function calOpenEventForm(event) {
      if (!event.isInstance()) {
        _openForm(event);
      } else {
        _openRecurringModal(event);
      }
    };

    ////////////

    function _openForm(event) {
      calEventUtils.setEditedEvent(event);
      if (screenSize.is('xs, sm')) {
        if (calEventUtils.isOrganizer(event)) {
          $state.go('calendar.event.form', {calendarId: calendarService.calendarHomeId, eventId: event.id});
        } else {
          $state.go('calendar.event.consult', {calendarId: calendarService.calendarHomeId, eventId: event.id});
        }
      } else {
        $modal({
          templateUrl: '/calendar/app/services/open-event-form/event-quick-form-view',
          resolve: {
            event: function(calEventUtils) {
              return calEventUtils.getEditedEvent();
            }
          },
          controller: function($scope, event) {
            $scope.event = event;
          },
          backdrop: 'static',
          placement: 'center'
        });
      }
    }

    function _openRecurringModal(event) {
      $modal({
        templateUrl: '/calendar/app/services/open-event-form/edit-instance-or-serie',
        resolve: {
          event: function() {
            return event;
          },
          openForm: function() {
            return _openForm;
          }
        },
        controller: function($scope, event, openForm) {
          $scope.event = event;
          $scope.editAllInstances = function() {
            $scope.$hide();
            event.getModifiedMaster().then(openForm);
          };

          $scope.editInstance = function() {
            $scope.$hide();
            openForm(event);
          };
        },
        openForm: _openForm,
        placement: 'center'
      });
    }
  }

})();
