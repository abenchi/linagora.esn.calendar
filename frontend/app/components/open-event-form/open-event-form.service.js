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

  function calOpenEventForm($rootScope, $modal, $state, calendarService, calEventUtils, calUIAuthorizationService, matchmedia, notificationFactory, session, SM_XS_MEDIA_QUERY, CAL_DEFAULT_CALENDAR_ID, CAL_EVENTS) {
    var modalIsOpen = false;

    return function calOpenEventForm(calendarHomeId, event) {
      calendarService.getCalendar(calendarHomeId, event.calendarId || CAL_DEFAULT_CALENDAR_ID).then(function(calendar) {
        if (calUIAuthorizationService.canAccessEventDetails(calendar, event, session.user._id)) {
          if (!event.isInstance()) {
            _openForm(calendar, event);
          } else {
            _openRecurringModal(calendar, event);
          }
        } else {
          notificationFactory.weakInfo('Private event', 'Cannot access private event');
        }
      });
    };

    ////////////

    function _openForm(calendar, event, recurrenceId) {
      calEventUtils.setEditedEvent(event);
      if (matchmedia.is(SM_XS_MEDIA_QUERY)) {
        if (calUIAuthorizationService.canModifyEvent(calendar, event, session.user._id)) {
          $state.go('calendar.event.form', {calendarHomeId: calendar.calendarHomeId, eventId: event.uid, recurrenceId: recurrenceId});
        } else {
          $state.go('calendar.event.consult', {calendarHomeId: calendar.calendarHomeId, eventId: event.uid, recurrenceId: recurrenceId});
        }
      } else if (modalIsOpen === false) {
        modalIsOpen = true;
        $modal({
          templateUrl: '/calendar/app/components/open-event-form/event-quick-form-view',
          resolve: {
            event: function(calEventUtils) {
              return calEventUtils.getEditedEvent();
            },
            calendar: function() {
              return calendar;
            }
          },
          controller: function($scope, event, calendar) {
            var _$hide = $scope.$hide;

            var unregister = $rootScope.$on(CAL_EVENTS.MODAL + '.hide', function() {
              $rootScope.$broadcast(CAL_EVENTS.CALENDAR_UNSELECT);
              $scope.$hide();
            });

            $scope.$hide = function() {
              _$hide.apply(this, arguments);
              modalIsOpen = false;
              unregister && unregister();
            };

            $scope.event = event;
            $scope.calendarHomeId = calendar.calendarHomeId;
          },
          backdrop: 'static',
          placement: 'center',
          prefixEvent: CAL_EVENTS.MODAL
        });
      }
    }

    function _openRecurringModal(calendar, event) {
      $modal({
        templateUrl: '/calendar/app/components/open-event-form/edit-instance-or-series',
        resolve: {
          calendar: function() {
            return calendar;
          },
          event: function() {
            return event;
          },
          openForm: function() {
            return _openForm;
          }
        },
        controller: function($scope, calendar, event, openForm) {
          $scope.event = event;
          $scope.calendarHomeId = calendar.calendarHomeId;

          $scope.editAllInstances = function() {
            $scope.$hide();
            event.getModifiedMaster().then(function(eventMaster) {
              openForm(calendar, eventMaster);
            });
          };

          $scope.editInstance = function() {
            $scope.$hide();
            openForm(calendar, event, event.recurrenceIdAsString);
          };
        },
        placement: 'center'
      });
    }
  }
})();
