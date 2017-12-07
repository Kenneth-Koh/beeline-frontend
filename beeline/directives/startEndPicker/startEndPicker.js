import { defaultMapOptions } from "../../shared/util"
import startEndPickerTemplate from "./startEndPicker.html"
import _ from "lodash"

export default [
  "uiGmapGoogleMapApi",
  "$cordovaGeolocation",
  function(uiGmapGoogleMapApi, $cordovaGeolocation) {
    return {
      restrict: "E",
      transclude: true,
      template: startEndPickerTemplate,
      scope: {
        prompt: "@",
        isValid: "=",
        startPoint: "=",
        endPoint: "=",
        setPoint: "=",
        control: "=",
        disabled: "=",
        mode: "=",
        onsubmit: "@",
      },
      link: function(scope, elem, attrs) {
        scope.map = defaultMapOptions({
          events: {
            // empty functions - to be overwritten
            dragstart: function(map, e, args) {},
            zoom_changed: function(map, e, args) {},
            dragend: function(map, e, args) {},
            click: function(map, e, args) {},
          },
          boardMarkerOptions: {},
          alightMarkerOptions: {},
          lineIcons: {},
        })

        scope.prompt = scope.prompt || "Next"
        scope.setPoint = scope.setPoint === undefined ? "start" : scope.setPoint
        scope.startPoint = _.extend(
          {
            text: "",
            coordinates: null,
          },
          scope.startPoint || {}
        )
        scope.endPoint = _.extend(
          {
            text: "",
            coordinates: null,
          },
          scope.endPoint || {}
        )
        scope.lineBetween = []

        scope.$watchGroup(
          ["startPoint.coordinates", "endPoint.coordinates"],
          function() {
            if (scope.startPoint.coordinates && scope.endPoint.coordinates) {
              scope.lineBetween = [
                scope.startPoint.coordinates,
                scope.endPoint.coordinates,
              ]
            } else {
              scope.lineBetween = []
            }
          }
        )

        let gmapResolve
        let gmapReady = new Promise(resolve => (gmapResolve = resolve))
        scope.mapReady = gmapResolve
        gmapReady.then(function x() {
          let gmap = scope.map.control.getGMap()
          scope.map.boardMarkerOptions = {
            icon: {
              url: "img/board.png",
              scaledSize: new google.maps.Size(20, 20),
              anchor: new google.maps.Point(5, 5),
            },
          }
          scope.map.alightMarkerOptions = {
            icon: {
              url: "img/alight.png",
              scaledSize: new google.maps.Size(20, 20),
              anchor: new google.maps.Point(5, 5),
            },
          }
          scope.map.lineIcons = [
            {
              icon: {
                path: 1,
                scale: 3,
                strokeColor: "#333",
              },
              offset: "20%",
              repeat: "50px",
            },
          ]

          let inputElems = elem[0].querySelectorAll("INPUT")
          let pickupautocomp = new google.maps.places.Autocomplete(
            inputElems[0]
          )
          let dropoffautocomp = new google.maps.places.Autocomplete(
            inputElems[1]
          )

          pickupautocomp.addListener("place_changed", function(event) {
            let pickupPos = pickupautocomp.getPlace().geometry.location

            scope.startPoint.coordinates = {
              lat: pickupPos.lat(),
              lng: pickupPos.lng(),
            }
            scope.startPoint.text = pickupautocomp.getPlace().formatted_address

            inputElems[0].blur()
            setTimeout(() => {
              gmap.setZoom(15)
              gmap.panTo(pickupPos)
              updateLocationText(gmap)
            }, 100)
          })

          dropoffautocomp.addListener("place_changed", function() {
            let dropoffPos = dropoffautocomp.getPlace().geometry.location

            scope.endPoint.coordinates = {
              lat: dropoffPos.lat(),
              lng: dropoffPos.lng(),
            }
            scope.endPoint.text = dropoffautocomp.getPlace().formatted_address

            inputElems[1].blur()
            setTimeout(() => {
              gmap.setZoom(15)
              gmap.panTo(dropoffPos)
              updateLocationText(gmap)
            }, 100)
          })

          scope.map.events = {
            click: () => {
              if (scope.inFocusElement) {
                scope.inFocusElement.blur()
              }
            },
            dragstart: function(map, e, args) {},
            zoom_changed: function(map, e, args) {
              updateCenter(map)
              updateLocationText(map, e, args)
            },
            dragend: function(map, e, args) {
              updateCenter(map)
              updateLocationText(map, e, args)
            },
          }

          // drop down list disappears before the clicked item is registered,
          // this will disable the click event on the lists' containers
          setTimeout(() => {
            let contain = document.getElementsByClassName("pac-container")
            angular.element(contain).attr("data-tap-disabled", "true")
          }, 500)
        })

        function fitToPoints() {
          let gmap = scope.map.control.getGMap()
          if (scope.startPoint.coordinates && scope.endPoint.coordinates) {
            let bounds = new google.maps.LatLngBounds()

            bounds.extend(
              new google.maps.LatLng({
                lat: scope.startPoint.coordinates.latitude,
                lng: scope.startPoint.coordinates.longitude,
              })
            )
            bounds.extend(
              new google.maps.LatLng({
                lat: scope.endPoint.coordinates.latitude,
                lng: scope.endPoint.coordinates.longitude,
              })
            )

            gmap.fitBounds(bounds)
          } else {
            gmap.setCenter({
              lat: 1.38,
              lng: 103.8,
            })
            gmap.setZoom(11)
          }
        }
        scope.$watch("control", function() {
          if (scope.control) {
            scope.control.fitToPoints = fitToPoints
          }
        })
        scope.nextBtnClick = function() {
          if (scope.setPoint == "start") {
            if (scope.startPoint.coordinates) {
              if (scope.endPoint.coordinates) {
                /* End point has been previously set, don't reset it */
                scope.setPoint = null
                fitToPoints()
              } else {
                scope.setPoint = "end"
              }
            }
          } else if (scope.setPoint == "end") {
            if (scope.endPoint.coordinates) {
              scope.setPoint = null
              fitToPoints()
            }
          } else {
            // FIXME: optimize this using a $parse
            scope.$parent.$eval(scope.onsubmit)
          }
        }
        scope.setSetPoint = function(what) {
          if (scope.disabled) {
            return
          }
          scope.setPoint = what

          if (scope[what + "Point"].coordinates) {
            scope.map.control.getGMap().panTo({
              lat: scope.startPoint.coordinates.latitude,
              lng: scope.startPoint.coordinates.longitude,
            })
          }
        }
        function updateCenter(map) {
          if (scope.setPoint == "start") {
            scope.startPoint.coordinates = {
              latitude: map.center.lat(),
              longitude: map.center.lng(),
            }
          } else if (scope.setPoint == "end") {
            scope.endPoint.coordinates = {
              latitude: map.center.lat(),
              longitude: map.center.lng(),
            }
          }
        }
        function updateLocationText(map) {
          if (!scope.setPoint) {
            return
          }

          let geocoder = new google.maps.Geocoder()
          geocoder.geocode({ latLng: map.getCenter() }, function(r, s) {
            if (!scope.setPoint) {
              return
            }
            let center = map.getCenter().toJSON()
            let point = scope[scope.setPoint + "Point"]
            if (s == "OK") {
              point.text = r[0].formatted_address
            } else {
              point.text = `${center.lat}, ${center.lng}`
            }
            point.coordinates = {
              latitude: center.lat,
              longitude: center.lng,
            }
          })
        }
        scope.inFocus = 0
        scope.inFocusElement = null
        scope.inputFocus = function($event, which) {
          scope.setPoint = which
          let point = scope[which + "Point"]
          if (point.coordinates) {
            scope.map.control.getGMap().panTo({
              lat: scope[which + "Point"].coordinates.latitude,
              lng: scope[which + "Point"].coordinates.longitude,
            })
          }
          scope.inFocusElement = $event.target
          scope.inFocus++
        }
        scope.inputBlur = function($event, which) {
          scope.inFocus--
        }
        scope.reset = function(which) {
          scope[`${which}Point`].text = ""
          scope[`${which}Point`].coordinates = null
          elem[0].querySelector(`.input-${which}`).focus()
        }
        scope.nextAllowed = function() {
          return (
            (scope.setPoint && scope[scope.setPoint + "Point"].coordinates) ||
            (!scope.setPoint &&
              scope.isValid &&
              scope.startPoint.coordinates &&
              scope.endPoint.coordinates)
          )
        }

        scope.$on("mapRequireResize", async function() {
          await uiGmapGoogleMapApi
          google.maps.event.trigger(scope.map.mapControl.getGMap(), "resize")
        })

        // Click function for User Position Icon
        scope.getUserLocation = function() {
          // promise
          $cordovaGeolocation
            .getCurrentPosition({ timeout: 5000, enableHighAccuracy: true })
            .then(
              function(userpos) {
                let gmap = scope.map.control.getGMap()
                gmap.panTo(
                  new google.maps.LatLng(
                    userpos.coords.latitude,
                    userpos.coords.longitude
                  )
                )
                setTimeout(function() {
                  gmap.setZoom(15)
                }, 300)
              },
              function(err) {
                console.error("ERROR - " + err)
              }
            )
        }
      },
    }
  },
]
