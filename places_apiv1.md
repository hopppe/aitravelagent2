Send feedback Package google.maps.places.v1 

bookmark_border
 
Index

Places (interface)
AddressDescriptor (message)
AddressDescriptor.Area (message)
AddressDescriptor.Area.Containment (enum)
AddressDescriptor.Landmark (message)
AddressDescriptor.Landmark.SpatialRelationship (enum)
AuthorAttribution (message)
AutocompletePlacesRequest (message)
AutocompletePlacesRequest.LocationBias (message)
AutocompletePlacesRequest.LocationRestriction (message)
AutocompletePlacesResponse (message)
AutocompletePlacesResponse.Suggestion (message)
AutocompletePlacesResponse.Suggestion.FormattableText (message)
AutocompletePlacesResponse.Suggestion.PlacePrediction (message)
AutocompletePlacesResponse.Suggestion.QueryPrediction (message)
AutocompletePlacesResponse.Suggestion.StringRange (message)
AutocompletePlacesResponse.Suggestion.StructuredFormat (message)
Circle (message)
ContentBlock (message)
ContextualContent (message)
ContextualContent.Justification (message)
ContextualContent.Justification.BusinessAvailabilityAttributesJustification (message)
ContextualContent.Justification.ReviewJustification (message)
ContextualContent.Justification.ReviewJustification.HighlightedText (message)
ContextualContent.Justification.ReviewJustification.HighlightedText.HighlightedTextRange (message)
EVChargeOptions (message)
EVChargeOptions.ConnectorAggregation (message)
EVConnectorType (enum)
FuelOptions (message)
FuelOptions.FuelPrice (message)
FuelOptions.FuelPrice.FuelType (enum)
GetPhotoMediaRequest (message)
GetPlaceRequest (message)
Photo (message)
PhotoMedia (message)
Place (message)
Place.AccessibilityOptions (message)
Place.AddressComponent (message)
Place.Attribution (message)
Place.BusinessStatus (enum)
Place.ContainingPlace (message)
Place.EvChargeAmenitySummary (message)
Place.GenerativeSummary (message)
Place.GoogleMapsLinks (message)
Place.NeighborhoodSummary (message)
Place.OpeningHours (message)
Place.OpeningHours.Period (message)
Place.OpeningHours.Period.Point (message)
Place.OpeningHours.SecondaryHoursType (enum)
Place.OpeningHours.SpecialDay (message)
Place.ParkingOptions (message)
Place.PaymentOptions (message)
Place.PlusCode (message)
Place.ReviewSummary (message)
Place.SubDestination (message)
Polyline (message)
PriceLevel (enum)
PriceRange (message)
Review (message)
RouteModifiers (message)
RoutingParameters (message)
RoutingPreference (enum)
RoutingSummary (message)
RoutingSummary.Leg (message)
SearchNearbyRequest (message)
SearchNearbyRequest.LocationRestriction (message)
SearchNearbyRequest.RankPreference (enum)
SearchNearbyResponse (message)
SearchTextRequest (message)
SearchTextRequest.EVOptions (message)
SearchTextRequest.LocationBias (message)
SearchTextRequest.LocationRestriction (message)
SearchTextRequest.RankPreference (enum)
SearchTextRequest.SearchAlongRouteParameters (message)
SearchTextResponse (message)
TravelMode (enum)
Places

Service definition for the Places API. Note: every request (except for Autocomplete requests) requires a field mask set outside of the request proto (all/*, is not assumed). The field mask can be set via the HTTP header X-Goog-FieldMask. See: https://developers.google.com/maps/documentation/places/web-service/choose-fields

AutocompletePlaces
rpc AutocompletePlaces(AutocompletePlacesRequest) returns (AutocompletePlacesResponse)

Returns predictions for the given input.

Authorization scopes
Requires the following OAuth scope:

https://www.googleapis.com/auth/cloud-platform
GetPhotoMedia
rpc GetPhotoMedia(GetPhotoMediaRequest) returns (PhotoMedia)

Get a photo media with a photo reference string.

Authorization scopes
Requires the following OAuth scope:

https://www.googleapis.com/auth/cloud-platform
GetPlace
rpc GetPlace(GetPlaceRequest) returns (Place)

Get the details of a place based on its resource name, which is a string in the places/{place_id} format.

Authorization scopes
Requires the following OAuth scope:

https://www.googleapis.com/auth/cloud-platform
SearchNearby
rpc SearchNearby(SearchNearbyRequest) returns (SearchNearbyResponse)

Search for places near locations.

Authorization scopes
Requires the following OAuth scope:

https://www.googleapis.com/auth/cloud-platform
SearchText
rpc SearchText(SearchTextRequest) returns (SearchTextResponse)

Text query based place search.

Authorization scopes
Requires the following OAuth scope:

https://www.googleapis.com/auth/cloud-platform
AddressDescriptor

A relational description of a location. Includes a ranked set of nearby landmarks and precise containing areas and their relationship to the target location.

Fields
landmarks[]	
Landmark

A ranked list of nearby landmarks. The most recognizable and nearby landmarks are ranked first.
areas[]	
Area

A ranked list of containing or adjacent areas. The most recognizable and precise areas are ranked first.
Area

Area information and the area's relationship with the target location.

Areas includes precise sublocality, neighborhoods, and large compounds that are useful for describing a location.

Fields
name	
string

The area's resource name.
place_id	
string

The area's place id.
display_name	
LocalizedText

The area's display name.
containment	
Containment

Defines the spatial relationship between the target location and the area.
Containment

Defines the spatial relationship between the target location and the area.

Enums
CONTAINMENT_UNSPECIFIED	The containment is unspecified.
WITHIN	The target location is within the area region, close to the center.
OUTSKIRTS	The target location is within the area region, close to the edge.
NEAR	The target location is outside the area region, but close by.
Landmark

Basic landmark information and the landmark's relationship with the target location.

Landmarks are prominent places that can be used to describe a location.

Fields
name	
string

The landmark's resource name.
place_id	
string

The landmark's place id.
display_name	
LocalizedText

The landmark's display name.
types[]	
string

A set of type tags for this landmark. For a complete list of possible values, see https://developers.google.com/maps/documentation/places/web-service/place-types.
spatial_relationship	
SpatialRelationship

Defines the spatial relationship between the target location and the landmark.
straight_line_distance_meters	
float

The straight line distance, in meters, between the center point of the target and the center point of the landmark. In some situations, this value can be longer than travel_distance_meters.
travel_distance_meters	
float

The travel distance, in meters, along the road network from the target to the landmark, if known. This value does not take into account the mode of transportation, such as walking, driving, or biking.
SpatialRelationship

Defines the spatial relationship between the target location and the landmark.

Enums
NEAR	This is the default relationship when nothing more specific below applies.
WITHIN	The landmark has a spatial geometry and the target is within its bounds.
BESIDE	The target is directly adjacent to the landmark.
ACROSS_THE_ROAD	The target is directly opposite the landmark on the other side of the road.
DOWN_THE_ROAD	On the same route as the landmark but not besides or across.
AROUND_THE_CORNER	Not on the same route as the landmark but a single turn away.
BEHIND	Close to the landmark's structure but further away from its street entrances.
AuthorAttribution

Information about the author of the UGC data. Used in Photo, and Review.

Fields
display_name	
string

Name of the author of the Photo or Review.
uri	
string

URI of the author of the Photo or Review.
photo_uri	
string

Profile photo URI of the author of the Photo or Review.
AutocompletePlacesRequest

Request proto for AutocompletePlaces.

Fields
input	
string

Required. The text string on which to search.
location_bias	
LocationBias

Optional. Bias results to a specified location.

At most one of location_bias or location_restriction should be set. If neither are set, the results will be biased by IP address, meaning the IP address will be mapped to an imprecise location and used as a biasing signal.
location_restriction	
LocationRestriction

Optional. Restrict results to a specified location.

At most one of location_bias or location_restriction should be set. If neither are set, the results will be biased by IP address, meaning the IP address will be mapped to an imprecise location and used as a biasing signal.
included_primary_types[]	
string

Optional. Included primary Place type (for example, "restaurant" or "gas_station") in Place Types (https://developers.google.com/maps/documentation/places/web-service/place-types), or only (regions), or only (cities). A Place is only returned if its primary type is included in this list. Up to 5 values can be specified. If no types are specified, all Place types are returned.
included_region_codes[]	
string

Optional. Only include results in the specified regions, specified as up to 15 CLDR two-character region codes. An empty set will not restrict the results. If both location_restriction and included_region_codes are set, the results will be located in the area of intersection.
language_code	
string

Optional. The language in which to return results. Defaults to en-US. The results may be in mixed languages if the language used in input is different from language_code or if the returned Place does not have a translation from the local language to language_code.
region_code	
string

Optional. The region code, specified as a CLDR two-character region code. This affects address formatting, result ranking, and may influence what results are returned. This does not restrict results to the specified region. To restrict results to a region, use region_code_restriction.
origin	
LatLng

Optional. The origin point from which to calculate geodesic distance to the destination (returned as distance_meters). If this value is omitted, geodesic distance will not be returned.
input_offset	
int32

Optional. A zero-based Unicode character offset of input indicating the cursor position in input. The cursor position may influence what predictions are returned.

If empty, defaults to the length of input.
include_query_predictions	
bool

Optional. If true, the response will include both Place and query predictions. Otherwise the response will only return Place predictions.
session_token	
string

Optional. A string which identifies an Autocomplete session for billing purposes. Must be a URL and filename safe base64 string with at most 36 ASCII characters in length. Otherwise an INVALID_ARGUMENT error is returned.

The session begins when the user starts typing a query, and concludes when they select a place and a call to Place Details or Address Validation is made. Each session can have multiple queries, followed by one Place Details or Address Validation request. The credentials used for each request within a session must belong to the same Google Cloud Console project. Once a session has concluded, the token is no longer valid; your app must generate a fresh token for each session. If the session_token parameter is omitted, or if you reuse a session token, the session is charged as if no session token was provided (each request is billed separately).

We recommend the following guidelines:

Use session tokens for all Place Autocomplete calls.
Generate a fresh token for each session. Using a version 4 UUID is recommended.
Ensure that the credentials used for all Place Autocomplete, Place Details, and Address Validation requests within a session belong to the same Cloud Console project.
Be sure to pass a unique session token for each new session. Using the same token for more than one session will result in each request being billed individually.
include_pure_service_area_businesses	
bool

Optional. Include pure service area businesses if the field is set to true. Pure service area business is a business that visits or delivers to customers directly but does not serve customers at their business address. For example, businesses like cleaning services or plumbers. Those businesses do not have a physical address or location on Google Maps. Places will not return fields including location, plus_code, and other location related fields for these businesses.
LocationBias

The region to search. The results may be biased around the specified region.

Fields
Union field type.

type can be only one of the following:
rectangle	
Viewport

A viewport defined by a northeast and a southwest corner.
circle	
Circle

A circle defined by a center point and radius.
LocationRestriction

The region to search. The results will be restricted to the specified region.

Fields
Union field type.

type can be only one of the following:
rectangle	
Viewport

A viewport defined by a northeast and a southwest corner.
circle	
Circle

A circle defined by a center point and radius.
AutocompletePlacesResponse

Response proto for AutocompletePlaces.

Fields
suggestions[]	
Suggestion

Contains a list of suggestions, ordered in descending order of relevance.
Suggestion

An Autocomplete suggestion result.

Fields
Union field kind.

kind can be only one of the following:
place_prediction	
PlacePrediction

A prediction for a Place.
query_prediction	
QueryPrediction

A prediction for a query.
FormattableText

Text representing a Place or query prediction. The text may be used as is or formatted.

Fields
text	
string

Text that may be used as is or formatted with matches.
matches[]	
StringRange

A list of string ranges identifying where the input request matched in text. The ranges can be used to format specific parts of text. The substrings may not be exact matches of input if the matching was determined by criteria other than string matching (for example, spell corrections or transliterations).

These values are Unicode character offsets of text. The ranges are guaranteed to be ordered in increasing offset values.
PlacePrediction

Prediction results for a Place Autocomplete prediction.

Fields
place	
string

The resource name of the suggested Place. This name can be used in other APIs that accept Place names.
place_id	
string

The unique identifier of the suggested Place. This identifier can be used in other APIs that accept Place IDs.
text	
FormattableText

Contains the human-readable name for the returned result. For establishment results, this is usually the business name and address.

text is recommended for developers who wish to show a single UI element. Developers who wish to show two separate, but related, UI elements may want to use structured_format instead. They are two different ways to represent a Place prediction. Users should not try to parse structured_format into text or vice versa.

This text may be different from the display_name returned by GetPlace.

May be in mixed languages if the request input and language_code are in different languages or if the Place does not have a translation from the local language to language_code.
structured_format	
StructuredFormat

A breakdown of the Place prediction into main text containing the name of the Place and secondary text containing additional disambiguating features (such as a city or region).

structured_format is recommended for developers who wish to show two separate, but related, UI elements. Developers who wish to show a single UI element may want to use text instead. They are two different ways to represent a Place prediction. Users should not try to parse structured_format into text or vice versa.
types[]	
string

List of types that apply to this Place from Table A or Table B in https://developers.google.com/maps/documentation/places/web-service/place-types.

A type is a categorization of a Place. Places with shared types will share similar characteristics.
distance_meters	
int32

The length of the geodesic in meters from origin if origin is specified. Certain predictions such as routes may not populate this field.
QueryPrediction

Prediction results for a Query Autocomplete prediction.

Fields
text	
FormattableText

The predicted text. This text does not represent a Place, but rather a text query that could be used in a search endpoint (for example, Text Search).

text is recommended for developers who wish to show a single UI element. Developers who wish to show two separate, but related, UI elements may want to use structured_format instead. They are two different ways to represent a query prediction. Users should not try to parse structured_format into text or vice versa.

May be in mixed languages if the request input and language_code are in different languages or if part of the query does not have a translation from the local language to language_code.
structured_format	
StructuredFormat

A breakdown of the query prediction into main text containing the query and secondary text containing additional disambiguating features (such as a city or region).

structured_format is recommended for developers who wish to show two separate, but related, UI elements. Developers who wish to show a single UI element may want to use text instead. They are two different ways to represent a query prediction. Users should not try to parse structured_format into text or vice versa.
StringRange

Identifies a substring within a given text.

Fields
start_offset	
int32

Zero-based offset of the first Unicode character of the string (inclusive).
end_offset	
int32

Zero-based offset of the last Unicode character (exclusive).
StructuredFormat

Contains a breakdown of a Place or query prediction into main text and secondary text.

For Place predictions, the main text contains the specific name of the Place. For query predictions, the main text contains the query.

The secondary text contains additional disambiguating features (such as a city or region) to further identify the Place or refine the query.

Fields
main_text	
FormattableText

Represents the name of the Place or query.
secondary_text	
FormattableText

Represents additional disambiguating features (such as a city or region) to further identify the Place or refine the query.
Circle

Circle with a LatLng as center and radius.

Fields
center	
LatLng

Required. Center latitude and longitude.

The range of latitude must be within [-90.0, 90.0]. The range of the longitude must be within [-180.0, 180.0].
radius	
double

Required. Radius measured in meters. The radius must be within [0.0, 50000.0].
ContentBlock

A block of content that can be served individually.

Fields
content	
LocalizedText

Content related to the topic.
referenced_places[]	
string

The list of resource names of the referenced places. This name can be used in other APIs that accept Place resource names.
ContextualContent

Experimental: See https://developers.google.com/maps/documentation/places/web-service/experimental/places-generative for more details.

Content that is contextual to the place query.

Fields
reviews[]	
Review

List of reviews about this place, contexual to the place query.
photos[]	
Photo

Information (including references) about photos of this place, contexual to the place query.
justifications[]	
Justification

Experimental: See https://developers.google.com/maps/documentation/places/web-service/experimental/places-generative for more details.

Justifications for the place.
Justification

Experimental: See https://developers.google.com/maps/documentation/places/web-service/experimental/places-generative for more details.

Justifications for the place. Justifications answers the question of why a place could interest an end user.

Fields
Union field justification.

justification can be only one of the following:
review_justification	
ReviewJustification

Experimental: See https://developers.google.com/maps/documentation/places/web-service/experimental/places-generative for more details.
business_availability_attributes_justification	
BusinessAvailabilityAttributesJustification

Experimental: See https://developers.google.com/maps/documentation/places/web-service/experimental/places-generative for more details.
BusinessAvailabilityAttributesJustification

Experimental: See https://developers.google.com/maps/documentation/places/web-service/experimental/places-generative for more details. BusinessAvailabilityAttributes justifications. This shows some attributes a business has that could interest an end user.

Fields
takeout	
bool

If a place provides takeout.
delivery	
bool

If a place provides delivery.
dine_in	
bool

If a place provides dine-in.
ReviewJustification

Experimental: See https://developers.google.com/maps/documentation/places/web-service/experimental/places-generative for more details.

User review justifications. This highlights a section of the user review that would interest an end user. For instance, if the search query is "firewood pizza", the review justification highlights the text relevant to the search query.

Fields
highlighted_text	
HighlightedText
review	
Review

The review that the highlighted text is generated from.
HighlightedText

The text highlighted by the justification. This is a subset of the review itself. The exact word to highlight is marked by the HighlightedTextRange. There could be several words in the text being highlighted.

Fields
text	
string
highlighted_text_ranges[]	
HighlightedTextRange

The list of the ranges of the highlighted text.
HighlightedTextRange

The range of highlighted text.

Fields
start_index	
int32
end_index	
int32
EVChargeOptions

Information about the EV Charge Station hosted in Place. Terminology follows https://afdc.energy.gov/fuels/electricity_infrastructure.html One port could charge one car at a time. One port has one or more connectors. One station has one or more ports.

Fields
connector_count	
int32

Number of connectors at this station. However, because some ports can have multiple connectors but only be able to charge one car at a time (e.g.) the number of connectors may be greater than the total number of cars which can charge simultaneously.
connector_aggregation[]	
ConnectorAggregation

A list of EV charging connector aggregations that contain connectors of the same type and same charge rate.
ConnectorAggregation

EV charging information grouped by [type, max_charge_rate_kw]. Shows EV charge aggregation of connectors that have the same type and max charge rate in kw.

Fields
type	
EVConnectorType

The connector type of this aggregation.
max_charge_rate_kw	
double

The static max charging rate in kw of each connector in the aggregation.
count	
int32

Number of connectors in this aggregation.
availability_last_update_time	
Timestamp

The timestamp when the connector availability information in this aggregation was last updated.
available_count	
int32

Number of connectors in this aggregation that are currently available.
out_of_service_count	
int32

Number of connectors in this aggregation that are currently out of service.
EVConnectorType

See http://ieeexplore.ieee.org/stamp/stamp.jsp?arnumber=6872107 for additional information/context on EV charging connector types.

Enums
EV_CONNECTOR_TYPE_UNSPECIFIED	Unspecified connector.
EV_CONNECTOR_TYPE_OTHER	Other connector types.
EV_CONNECTOR_TYPE_J1772	J1772 type 1 connector.
EV_CONNECTOR_TYPE_TYPE_2	IEC 62196 type 2 connector. Often referred to as MENNEKES.
EV_CONNECTOR_TYPE_CHADEMO	CHAdeMO type connector.
EV_CONNECTOR_TYPE_CCS_COMBO_1	Combined Charging System (AC and DC). Based on SAE. Type-1 J-1772 connector
EV_CONNECTOR_TYPE_CCS_COMBO_2	Combined Charging System (AC and DC). Based on Type-2 Mennekes connector
EV_CONNECTOR_TYPE_TESLA	The generic TESLA connector. This is NACS in the North America but can be non-NACS in other parts of the world (e.g. CCS Combo 2 (CCS2) or GB/T). This value is less representative of an actual connector type, and more represents the ability to charge a Tesla brand vehicle at a Tesla owned charging station.
EV_CONNECTOR_TYPE_UNSPECIFIED_GB_T	GB/T type corresponds to the GB/T standard in China. This type covers all GB_T types.
EV_CONNECTOR_TYPE_UNSPECIFIED_WALL_OUTLET	Unspecified wall outlet.
EV_CONNECTOR_TYPE_NACS	The North American Charging System (NACS), standardized as SAE J3400.
FuelOptions

The most recent information about fuel options in a gas station. This information is updated regularly.

Fields
fuel_prices[]	
FuelPrice

The last known fuel price for each type of fuel this station has. There is one entry per fuel type this station has. Order is not important.
FuelPrice

Fuel price information for a given type.

Fields
type	
FuelType

The type of fuel.
price	
Money

The price of the fuel.
update_time	
Timestamp

The time the fuel price was last updated.
FuelType

Types of fuel.

Enums
FUEL_TYPE_UNSPECIFIED	Unspecified fuel type.
DIESEL	Diesel fuel.
DIESEL_PLUS	Diesel plus fuel.
REGULAR_UNLEADED	Regular unleaded.
MIDGRADE	Midgrade.
PREMIUM	Premium.
SP91	SP 91.
SP91_E10	SP 91 E10.
SP92	SP 92.
SP95	SP 95.
SP95_E10	SP95 E10.
SP98	SP 98.
SP99	SP 99.
SP100	SP 100.
LPG	Liquefied Petroleum Gas.
E80	E 80.
E85	E 85.
E100	E 100.
METHANE	Methane.
BIO_DIESEL	Bio-diesel.
TRUCK_DIESEL	Truck diesel.
GetPhotoMediaRequest

Request for fetching a photo of a place using a photo resource name.

Fields
name	
string

Required. The resource name of a photo media in the format: places/{place_id}/photos/{photo_reference}/media.

The resource name of a photo as returned in a Place object's photos.name field comes with the format places/{place_id}/photos/{photo_reference}. You need to append /media at the end of the photo resource to get the photo media resource name.
max_width_px	
int32

Optional. Specifies the maximum desired width, in pixels, of the image. If the image is smaller than the values specified, the original image will be returned. If the image is larger in either dimension, it will be scaled to match the smaller of the two dimensions, restricted to its original aspect ratio. Both the max_height_px and max_width_px properties accept an integer between 1 and 4800, inclusively. If the value is not within the allowed range, an INVALID_ARGUMENT error will be returned.

At least one of max_height_px or max_width_px needs to be specified. If neither max_height_px nor max_width_px is specified, an INVALID_ARGUMENT error will be returned.
max_height_px	
int32

Optional. Specifies the maximum desired height, in pixels, of the image. If the image is smaller than the values specified, the original image will be returned. If the image is larger in either dimension, it will be scaled to match the smaller of the two dimensions, restricted to its original aspect ratio. Both the max_height_px and max_width_px properties accept an integer between 1 and 4800, inclusively. If the value is not within the allowed range, an INVALID_ARGUMENT error will be returned.

At least one of max_height_px or max_width_px needs to be specified. If neither max_height_px nor max_width_px is specified, an INVALID_ARGUMENT error will be returned.
skip_http_redirect	
bool

Optional. If set, skip the default HTTP redirect behavior and render a text format (for example, in JSON format for HTTP use case) response. If not set, an HTTP redirect will be issued to redirect the call to the image media. This option is ignored for non-HTTP requests.
GetPlaceRequest

Request for fetching a Place based on its resource name, which is a string in the places/{place_id} format.

Fields
name	
string

Required. The resource name of a place, in the places/{place_id} format.
language_code	
string

Optional. Place details will be displayed with the preferred language if available.

Current list of supported languages: https://developers.google.com/maps/faq#languagesupport.
region_code	
string

Optional. The Unicode country/region code (CLDR) of the location where the request is coming from. This parameter is used to display the place details, like region-specific place name, if available. The parameter can affect results based on applicable law. For more information, see https://www.unicode.org/cldr/charts/latest/supplemental/territory_language_information.html.

Note that 3-digit region codes are not currently supported.
session_token	
string

Optional. A string which identifies an Autocomplete session for billing purposes. Must be a URL and filename safe base64 string with at most 36 ASCII characters in length. Otherwise an INVALID_ARGUMENT error is returned.

The session begins when the user starts typing a query, and concludes when they select a place and a call to Place Details or Address Validation is made. Each session can have multiple queries, followed by one Place Details or Address Validation request. The credentials used for each request within a session must belong to the same Google Cloud Console project. Once a session has concluded, the token is no longer valid; your app must generate a fresh token for each session. If the session_token parameter is omitted, or if you reuse a session token, the session is charged as if no session token was provided (each request is billed separately).

We recommend the following guidelines:

Use session tokens for all Place Autocomplete calls.
Generate a fresh token for each session. Using a version 4 UUID is recommended.
Ensure that the credentials used for all Place Autocomplete, Place Details, and Address Validation requests within a session belong to the same Cloud Console project.
Be sure to pass a unique session token for each new session. Using the same token for more than one session will result in each request being billed individually.
Photo

Information about a photo of a place.

Fields
name	
string

Identifier. A reference representing this place photo which may be used to look up this place photo again (also called the API "resource" name: places/{place_id}/photos/{photo}).
width_px	
int32

The maximum available width, in pixels.
height_px	
int32

The maximum available height, in pixels.
author_attributions[]	
AuthorAttribution

This photo's authors.
flag_content_uri	
string

A link where users can flag a problem with the photo.
google_maps_uri	
string

A link to show the photo on Google Maps.
PhotoMedia

A photo media from Places API.

Fields
name	
string

The resource name of a photo media in the format: places/{place_id}/photos/{photo_reference}/media.
photo_uri	
string

A short-lived uri that can be used to render the photo.
Place

All the information representing a Place.

Fields
name	
string

This Place's resource name, in places/{place_id} format. Can be used to look up the Place.
id	
string

The unique identifier of a place.
display_name	
LocalizedText

The localized name of the place, suitable as a short human-readable description. For example, "Google Sydney", "Starbucks", "Pyrmont", etc.
types[]	
string

A set of type tags for this result. For example, "political" and "locality". For the complete list of possible values, see Table A and Table B at https://developers.google.com/maps/documentation/places/web-service/place-types
primary_type	
string

The primary type of the given result. This type must one of the Places API supported types. For example, "restaurant", "cafe", "airport", etc. A place can only have a single primary type. For the complete list of possible values, see Table A and Table B at https://developers.google.com/maps/documentation/places/web-service/place-types
primary_type_display_name	
LocalizedText

The display name of the primary type, localized to the request language if applicable. For the complete list of possible values, see Table A and Table B at https://developers.google.com/maps/documentation/places/web-service/place-types
national_phone_number	
string

A human-readable phone number for the place, in national format.
international_phone_number	
string

A human-readable phone number for the place, in international format.
formatted_address	
string

A full, human-readable address for this place.
short_formatted_address	
string

A short, human-readable address for this place.
postal_address	
PostalAddress

The address in postal address format.
address_components[]	
AddressComponent

Repeated components for each locality level. Note the following facts about the address_components[] array: - The array of address components may contain more components than the formatted_address. - The array does not necessarily include all the political entities that contain an address, apart from those included in the formatted_address. To retrieve all the political entities that contain a specific address, you should use reverse geocoding, passing the latitude/longitude of the address as a parameter to the request. - The format of the response is not guaranteed to remain the same between requests. In particular, the number of address_components varies based on the address requested and can change over time for the same address. A component can change position in the array. The type of the component can change. A particular component may be missing in a later response.
plus_code	
PlusCode

Plus code of the place location lat/long.
location	
LatLng

The position of this place.
viewport	
Viewport

A viewport suitable for displaying the place on an average-sized map. This viewport should not be used as the physical boundary or the service area of the business.
rating	
double

A rating between 1.0 and 5.0, based on user reviews of this place.
google_maps_uri	
string

A URL providing more information about this place.
website_uri	
string

The authoritative website for this place, e.g. a business' homepage. Note that for places that are part of a chain (e.g. an IKEA store), this will usually be the website for the individual store, not the overall chain.
reviews[]	
Review

List of reviews about this place, sorted by relevance. A maximum of 5 reviews can be returned.
regular_opening_hours	
OpeningHours

The regular hours of operation. Note that if a place is always open (24 hours), the close field will not be set. Clients can rely on always open (24 hours) being represented as an open period containing day with value 0, hour with value 0, and minute with value 0.
time_zone	
TimeZone

IANA Time Zone Database time zone. For example "America/New_York".
photos[]	
Photo

Information (including references) about photos of this place. A maximum of 10 photos can be returned.
adr_format_address	
string

The place's address in adr microformat: http://microformats.org/wiki/adr.
business_status	
BusinessStatus

The business status for the place.
price_level	
PriceLevel

Price level of the place.
attributions[]	
Attribution

A set of data provider that must be shown with this result.
icon_mask_base_uri	
string

A truncated URL to an icon mask. User can access different icon type by appending type suffix to the end (eg, ".svg" or ".png").
icon_background_color	
string

Background color for icon_mask in hex format, e.g. #909CE1.
current_opening_hours	
OpeningHours

The hours of operation for the next seven days (including today). The time period starts at midnight on the date of the request and ends at 11:59 pm six days later. This field includes the special_days subfield of all hours, set for dates that have exceptional hours.
current_secondary_opening_hours[]	
OpeningHours

Contains an array of entries for the next seven days including information about secondary hours of a business. Secondary hours are different from a business's main hours. For example, a restaurant can specify drive through hours or delivery hours as its secondary hours. This field populates the type subfield, which draws from a predefined list of opening hours types (such as DRIVE_THROUGH, PICKUP, or TAKEOUT) based on the types of the place. This field includes the special_days subfield of all hours, set for dates that have exceptional hours.
regular_secondary_opening_hours[]	
OpeningHours

Contains an array of entries for information about regular secondary hours of a business. Secondary hours are different from a business's main hours. For example, a restaurant can specify drive through hours or delivery hours as its secondary hours. This field populates the type subfield, which draws from a predefined list of opening hours types (such as DRIVE_THROUGH, PICKUP, or TAKEOUT) based on the types of the place.
editorial_summary	
LocalizedText

Contains a summary of the place. A summary is comprised of a textual overview, and also includes the language code for these if applicable. Summary text must be presented as-is and can not be modified or altered.
payment_options	
PaymentOptions

Payment options the place accepts. If a payment option data is not available, the payment option field will be unset.
parking_options	
ParkingOptions

Options of parking provided by the place.
sub_destinations[]	
SubDestination

A list of sub-destinations related to the place.
fuel_options	
FuelOptions

The most recent information about fuel options in a gas station. This information is updated regularly.
ev_charge_options	
EVChargeOptions

Information of ev charging options.
generative_summary	
GenerativeSummary

AI-generated summary of the place.
containing_places[]	
ContainingPlace

List of places in which the current place is located.
address_descriptor	
AddressDescriptor

The address descriptor of the place. Address descriptors include additional information that help describe a location using landmarks and areas. See address descriptor regional coverage in https://developers.google.com/maps/documentation/geocoding/address-descriptors/coverage.
google_maps_links	
GoogleMapsLinks

Links to trigger different Google Maps actions.
price_range	
PriceRange

The price range associated with a Place.
review_summary	
ReviewSummary

AI-generated summary of the place using user reviews.
ev_charge_amenity_summary	
EvChargeAmenitySummary

The summary of amenities near the EV charging station.
neighborhood_summary	
NeighborhoodSummary

A summary of points of interest near the place.
utc_offset_minutes	
int32

Number of minutes this place's timezone is currently offset from UTC. This is expressed in minutes to support timezones that are offset by fractions of an hour, e.g. X hours and 15 minutes.
user_rating_count	
int32

The total number of reviews (with or without text) for this place.
takeout	
bool

Specifies if the business supports takeout.
delivery	
bool

Specifies if the business supports delivery.
dine_in	
bool

Specifies if the business supports indoor or outdoor seating options.
curbside_pickup	
bool

Specifies if the business supports curbside pickup.
reservable	
bool

Specifies if the place supports reservations.
serves_breakfast	
bool

Specifies if the place serves breakfast.
serves_lunch	
bool

Specifies if the place serves lunch.
serves_dinner	
bool

Specifies if the place serves dinner.
serves_beer	
bool

Specifies if the place serves beer.
serves_wine	
bool

Specifies if the place serves wine.
serves_brunch	
bool

Specifies if the place serves brunch.
serves_vegetarian_food	
bool

Specifies if the place serves vegetarian food.
outdoor_seating	
bool

Place provides outdoor seating.
live_music	
bool

Place provides live music.
menu_for_children	
bool

Place has a children's menu.
serves_cocktails	
bool

Place serves cocktails.
serves_dessert	
bool

Place serves dessert.
serves_coffee	
bool

Place serves coffee.
good_for_children	
bool

Place is good for children.
allows_dogs	
bool

Place allows dogs.
restroom	
bool

Place has restroom.
good_for_groups	
bool

Place accommodates groups.
good_for_watching_sports	
bool

Place is suitable for watching sports.
accessibility_options	
AccessibilityOptions

Information about the accessibility options a place offers.
pure_service_area_business	
bool

Indicates whether the place is a pure service area business. Pure service area business is a business that visits or delivers to customers directly but does not serve customers at their business address. For example, businesses like cleaning services or plumbers. Those businesses may not have a physical address or location on Google Maps.
AccessibilityOptions

Information about the accessibility options a place offers.

Fields
wheelchair_accessible_parking	
bool

Place offers wheelchair accessible parking.
wheelchair_accessible_entrance	
bool

Places has wheelchair accessible entrance.
wheelchair_accessible_restroom	
bool

Place has wheelchair accessible restroom.
wheelchair_accessible_seating	
bool

Place has wheelchair accessible seating.
AddressComponent

The structured components that form the formatted address, if this information is available.

Fields
long_text	
string

The full text description or name of the address component. For example, an address component for the country Australia may have a long_name of "Australia".
short_text	
string

An abbreviated textual name for the address component, if available. For example, an address component for the country of Australia may have a short_name of "AU".
types[]	
string

An array indicating the type(s) of the address component.
language_code	
string

The language used to format this components, in CLDR notation.
Attribution

Information about data providers of this place.

Fields
provider	
string

Name of the Place's data provider.
provider_uri	
string

URI to the Place's data provider.
BusinessStatus

Business status for the place.

Enums
BUSINESS_STATUS_UNSPECIFIED	Default value. This value is unused.
OPERATIONAL	The establishment is operational, not necessarily open now.
CLOSED_TEMPORARILY	The establishment is temporarily closed.
CLOSED_PERMANENTLY	The establishment is permanently closed.
ContainingPlace

Info about the place in which this place is located.

Fields
name	
string

The resource name of the place in which this place is located.
id	
string

The place id of the place in which this place is located.
EvChargeAmenitySummary

The summary of amenities near the EV charging station. This only applies to places with type electric_vehicle_charging_station. The overview field is guaranteed to be provided while the other fields are optional.

Fields
overview	
ContentBlock

An overview of the available amenities. This is guaranteed to be provided.
coffee	
ContentBlock

A summary of the nearby coffee options.
restaurant	
ContentBlock

A summary of the nearby restaurants.
store	
ContentBlock

A summary of the nearby gas stations.
flag_content_uri	
string

A link where users can flag a problem with the summary.
disclosure_text	
LocalizedText

The AI disclosure message "Summarized with Gemini" (and its localized variants). This will be in the language specified in the request if available.
GenerativeSummary

AI-generated summary of the place.

Fields
overview	
LocalizedText

The overview of the place.
overview_flag_content_uri	
string

A link where users can flag a problem with the overview summary.
disclosure_text	
LocalizedText

The AI disclosure message "Summarized with Gemini" (and its localized variants). This will be in the language specified in the request if available.
GoogleMapsLinks

Links to trigger different Google Maps actions.

Fields
directions_uri	
string

A link to show the directions to the place. The link only populates the destination location and uses the default travel mode DRIVE.
place_uri	
string

A link to show this place.
write_a_review_uri	
string

A link to write a review for this place on Google Maps.
reviews_uri	
string

A link to show reviews of this place on Google Maps.
photos_uri	
string

A link to show reviews of this place on Google Maps.
NeighborhoodSummary

A summary of points of interest near the place.

Fields
overview	
ContentBlock

An overview summary of the neighborhood.
description	
ContentBlock

A detailed description of the neighborhood.
flag_content_uri	
string

A link where users can flag a problem with the summary.
disclosure_text	
LocalizedText

The AI disclosure message "Summarized with Gemini" (and its localized variants). This will be in the language specified in the request if available.
OpeningHours

Information about business hour of the place.

Fields
periods[]	
Period

The periods that this place is open during the week. The periods are in chronological order, starting with Sunday in the place-local timezone. An empty (but not absent) value indicates a place that is never open, e.g. because it is closed temporarily for renovations.
weekday_descriptions[]	
string

Localized strings describing the opening hours of this place, one string for each day of the week. Will be empty if the hours are unknown or could not be converted to localized text. Example: "Sun: 18:00–06:00"
secondary_hours_type	
SecondaryHoursType

A type string used to identify the type of secondary hours.
special_days[]	
SpecialDay

Structured information for special days that fall within the period that the returned opening hours cover. Special days are days that could impact the business hours of a place, e.g. Christmas day. Set for current_opening_hours and current_secondary_opening_hours if there are exceptional hours.
next_open_time	
Timestamp

The next time the current opening hours period starts up to 7 days in the future. This field is only populated if the opening hours period is not active at the time of serving the request.
next_close_time	
Timestamp

The next time the current opening hours period ends up to 7 days in the future. This field is only populated if the opening hours period is active at the time of serving the request.
open_now	
bool

Whether the opening hours period is currently active. For regular opening hours and current opening hours, this field means whether the place is open. For secondary opening hours and current secondary opening hours, this field means whether the secondary hours of this place is active.
Period

A period the place remains in open_now status.

Fields
open	
Point

The time that the place starts to be open.
close	
Point

The time that the place starts to be closed.
Point

Status changing points.

Fields
date	
Date

Date in the local timezone for the place.
truncated	
bool

Whether or not this endpoint was truncated. Truncation occurs when the real hours are outside the times we are willing to return hours between, so we truncate the hours back to these boundaries. This ensures that at most 24 * 7 hours from midnight of the day of the request are returned.
day	
int32

A day of the week, as an integer in the range 0-6. 0 is Sunday, 1 is Monday, etc.
hour	
int32

The hour in 24 hour format. Ranges from 0 to 23.
minute	
int32

The minute. Ranges from 0 to 59.
SecondaryHoursType

A type used to identify the type of secondary hours.

Enums
SECONDARY_HOURS_TYPE_UNSPECIFIED	Default value when secondary hour type is not specified.
DRIVE_THROUGH	The drive-through hour for banks, restaurants, or pharmacies.
HAPPY_HOUR	The happy hour.
DELIVERY	The delivery hour.
TAKEOUT	The takeout hour.
KITCHEN	The kitchen hour.
BREAKFAST	The breakfast hour.
LUNCH	The lunch hour.
DINNER	The dinner hour.
BRUNCH	The brunch hour.
PICKUP	The pickup hour.
ACCESS	The access hours for storage places.
SENIOR_HOURS	The special hours for seniors.
ONLINE_SERVICE_HOURS	The online service hours.
SpecialDay

Structured information for special days that fall within the period that the returned opening hours cover. Special days are days that could impact the business hours of a place, e.g. Christmas day.

Fields
date	
Date

The date of this special day.
ParkingOptions

Information about parking options for the place. A parking lot could support more than one option at the same time.

Fields
free_parking_lot	
bool

Place offers free parking lots.
paid_parking_lot	
bool

Place offers paid parking lots.
free_street_parking	
bool

Place offers free street parking.
paid_street_parking	
bool

Place offers paid street parking.
valet_parking	
bool

Place offers valet parking.
free_garage_parking	
bool

Place offers free garage parking.
paid_garage_parking	
bool

Place offers paid garage parking.
PaymentOptions

Payment options the place accepts.

Fields
accepts_credit_cards	
bool

Place accepts credit cards as payment.
accepts_debit_cards	
bool

Place accepts debit cards as payment.
accepts_cash_only	
bool

Place accepts cash only as payment. Places with this attribute may still accept other payment methods.
accepts_nfc	
bool

Place accepts NFC payments.
PlusCode

Plus code (http://plus.codes) is a location reference with two formats: global code defining a 14mx14m (1/8000th of a degree) or smaller rectangle, and compound code, replacing the prefix with a reference location.

Fields
global_code	
string

Place's global (full) code, such as "9FWM33GV+HQ", representing an 1/8000 by 1/8000 degree area (~14 by 14 meters).
compound_code	
string

Place's compound code, such as "33GV+HQ, Ramberg, Norway", containing the suffix of the global code and replacing the prefix with a formatted name of a reference entity.
ReviewSummary

AI-generated summary of the place using user reviews.

Fields
text	
LocalizedText

The summary of user reviews.
flag_content_uri	
string

A link where users can flag a problem with the summary.
disclosure_text	
LocalizedText

The AI disclosure message "Summarized with Gemini" (and its localized variants). This will be in the language specified in the request if available.
reviews_uri	
string

A link to show reviews of this place on Google Maps.
SubDestination

Sub-destinations are specific places associated with a main place. These provide more specific destinations for users who are searching within a large or complex place, like an airport, national park, university, or stadium. For example, sub-destinations at an airport might include associated terminals and parking lots. Sub-destinations return the place ID and place resource name, which can be used in subsequent Place Details (New) requests to fetch richer details, including the sub-destination's display name and location.

Fields
name	
string

The resource name of the sub-destination.
id	
string

The place id of the sub-destination.
Polyline

A route polyline. Only supports an encoded polyline, which can be passed as a string and includes compression with minimal lossiness. This is the Routes API default output.

Fields
Union field polyline_type. Encapsulates the type of polyline. Routes API output defaults to encoded_polyline. polyline_type can be only one of the following:
encoded_polyline	
string

An encoded polyline, as returned by the Routes API by default. See the encoder and decoder tools.
PriceLevel

Price level of the place.

Enums
PRICE_LEVEL_UNSPECIFIED	Place price level is unspecified or unknown.
PRICE_LEVEL_FREE	Place provides free services.
PRICE_LEVEL_INEXPENSIVE	Place provides inexpensive services.
PRICE_LEVEL_MODERATE	Place provides moderately priced services.
PRICE_LEVEL_EXPENSIVE	Place provides expensive services.
PRICE_LEVEL_VERY_EXPENSIVE	Place provides very expensive services.
PriceRange

The price range associated with a Place. end_price could be unset, which indicates a range without upper bound (e.g. "More than $100").

Fields
start_price	
Money

The low end of the price range (inclusive). Price should be at or above this amount.
end_price	
Money

The high end of the price range (exclusive). Price should be lower than this amount.
Review

Information about a review of a place.

Fields
name	
string

A reference representing this place review which may be used to look up this place review again (also called the API "resource" name: places/{place_id}/reviews/{review}).
relative_publish_time_description	
string

A string of formatted recent time, expressing the review time relative to the current time in a form appropriate for the language and country.
text	
LocalizedText

The localized text of the review.
original_text	
LocalizedText

The review text in its original language.
rating	
double

A number between 1.0 and 5.0, also called the number of stars.
author_attribution	
AuthorAttribution

This review's author.
publish_time	
Timestamp

Timestamp for the review.
flag_content_uri	
string

A link where users can flag a problem with the review.
google_maps_uri	
string

A link to show the review on Google Maps.
RouteModifiers

Encapsulates a set of optional conditions to satisfy when calculating the routes.

Fields
avoid_tolls	
bool

Optional. When set to true, avoids toll roads where reasonable, giving preference to routes not containing toll roads. Applies only to the DRIVE and TWO_WHEELER TravelMode.
avoid_highways	
bool

Optional. When set to true, avoids highways where reasonable, giving preference to routes not containing highways. Applies only to the DRIVE and TWO_WHEELER TravelMode.
avoid_ferries	
bool

Optional. When set to true, avoids ferries where reasonable, giving preference to routes not containing ferries. Applies only to the DRIVE and TWO_WHEELER TravelMode.
avoid_indoor	
bool

Optional. When set to true, avoids navigating indoors where reasonable, giving preference to routes not containing indoor navigation. Applies only to the WALK TravelMode.
RoutingParameters

Parameters to configure the routing calculations to the places in the response, both along a route (where result ranking will be influenced) and for calculating travel times on results.

Fields
origin	
LatLng

Optional. An explicit routing origin that overrides the origin defined in the polyline. By default, the polyline origin is used.
travel_mode	
TravelMode

Optional. The travel mode.
route_modifiers	
RouteModifiers

Optional. The route modifiers.
routing_preference	
RoutingPreference

Optional. Specifies how to compute the routing summaries. The server attempts to use the selected routing preference to compute the route. The traffic aware routing preference is only available for the DRIVE or TWO_WHEELER travelMode.
RoutingPreference

A set of values that specify factors to take into consideration when calculating the route.

Enums
ROUTING_PREFERENCE_UNSPECIFIED	No routing preference specified. Default to TRAFFIC_UNAWARE.
TRAFFIC_UNAWARE	Computes routes without taking live traffic conditions into consideration. Suitable when traffic conditions don't matter or are not applicable. Using this value produces the lowest latency. Note: For TravelMode DRIVE and TWO_WHEELER, the route and duration chosen are based on road network and average time-independent traffic conditions, not current road conditions. Consequently, routes may include roads that are temporarily closed. Results for a given request may vary over time due to changes in the road network, updated average traffic conditions, and the distributed nature of the service. Results may also vary between nearly-equivalent routes at any time or frequency.
TRAFFIC_AWARE	Calculates routes taking live traffic conditions into consideration. In contrast to TRAFFIC_AWARE_OPTIMAL, some optimizations are applied to significantly reduce latency.
TRAFFIC_AWARE_OPTIMAL	Calculates the routes taking live traffic conditions into consideration, without applying most performance optimizations. Using this value produces the highest latency.
RoutingSummary

The duration and distance from the routing origin to a place in the response, and a second leg from that place to the destination, if requested. Note: Adding routingSummaries in the field mask without also including either the routingParameters.origin parameter or the searchAlongRouteParameters.polyline.encodedPolyline parameter in the request causes an error.

Fields
legs[]	
Leg

The legs of the trip.

When you calculate travel duration and distance from a set origin, legs contains a single leg containing the duration and distance from the origin to the destination. When you do a search along route, legs contains two legs: one from the origin to place, and one from the place to the destination.
directions_uri	
string

A link to show directions on Google Maps using the waypoints from the given routing summary. The route generated by this link is not guaranteed to be the same as the route used to generate the routing summary. The link uses information provided in the request, from fields including routingParameters and searchAlongRouteParameters when applicable, to generate the directions link.
Leg

A leg is a single portion of a journey from one location to another.

Fields
duration	
Duration

The time it takes to complete this leg of the trip.
distance_meters	
int32

The distance of this leg of the trip.
SearchNearbyRequest

Request proto for Search Nearby.

Fields
language_code	
string

Place details will be displayed with the preferred language if available. If the language code is unspecified or unrecognized, place details of any language may be returned, with a preference for English if such details exist.

Current list of supported languages: https://developers.google.com/maps/faq#languagesupport.
region_code	
string

The Unicode country/region code (CLDR) of the location where the request is coming from. This parameter is used to display the place details, like region-specific place name, if available. The parameter can affect results based on applicable law.

For more information, see https://www.unicode.org/cldr/charts/latest/supplemental/territory_language_information.html.

Note that 3-digit region codes are not currently supported.
included_types[]	
string

Included Place type (eg, "restaurant" or "gas_station") from https://developers.google.com/maps/documentation/places/web-service/place-types.

Up to 50 types from Table A may be specified.

If there are any conflicting types, i.e. a type appears in both included_types and excluded_types, an INVALID_ARGUMENT error is returned.

If a Place type is specified with multiple type restrictions, only places that satisfy all of the restrictions are returned. For example, if we have {included_types = ["restaurant"], excluded_primary_types = ["restaurant"]}, the returned places provide "restaurant" related services but do not operate primarily as "restaurants".
excluded_types[]	
string

Excluded Place type (eg, "restaurant" or "gas_station") from https://developers.google.com/maps/documentation/places/web-service/place-types.

Up to 50 types from Table A may be specified.

If the client provides both included_types (e.g. restaurant) and excluded_types (e.g. cafe), then the response should include places that are restaurant but not cafe. The response includes places that match at least one of the included_types and none of the excluded_types.

If there are any conflicting types, i.e. a type appears in both included_types and excluded_types, an INVALID_ARGUMENT error is returned.

If a Place type is specified with multiple type restrictions, only places that satisfy all of the restrictions are returned. For example, if we have {included_types = ["restaurant"], excluded_primary_types = ["restaurant"]}, the returned places provide "restaurant" related services but do not operate primarily as "restaurants".
included_primary_types[]	
string

Included primary Place type (e.g. "restaurant" or "gas_station") from https://developers.google.com/maps/documentation/places/web-service/place-types. A place can only have a single primary type from the supported types table associated with it.

Up to 50 types from Table A may be specified.

If there are any conflicting primary types, i.e. a type appears in both included_primary_types and excluded_primary_types, an INVALID_ARGUMENT error is returned.

If a Place type is specified with multiple type restrictions, only places that satisfy all of the restrictions are returned. For example, if we have {included_types = ["restaurant"], excluded_primary_types = ["restaurant"]}, the returned places provide "restaurant" related services but do not operate primarily as "restaurants".
excluded_primary_types[]	
string

Excluded primary Place type (e.g. "restaurant" or "gas_station") from https://developers.google.com/maps/documentation/places/web-service/place-types.

Up to 50 types from Table A may be specified.

If there are any conflicting primary types, i.e. a type appears in both included_primary_types and excluded_primary_types, an INVALID_ARGUMENT error is returned.

If a Place type is specified with multiple type restrictions, only places that satisfy all of the restrictions are returned. For example, if we have {included_types = ["restaurant"], excluded_primary_types = ["restaurant"]}, the returned places provide "restaurant" related services but do not operate primarily as "restaurants".
max_result_count	
int32

Maximum number of results to return. It must be between 1 and 20 (default), inclusively. If the number is unset, it falls back to the upper limit. If the number is set to negative or exceeds the upper limit, an INVALID_ARGUMENT error is returned.
location_restriction	
LocationRestriction

Required. The region to search.
rank_preference	
RankPreference

How results will be ranked in the response.
routing_parameters	
RoutingParameters

Optional. Parameters that affect the routing to the search results.
LocationRestriction

The region to search.

Fields
Union field type.

type can be only one of the following:
circle	
Circle

A circle defined by center point and radius.
RankPreference

How results will be ranked in the response.

Enums
RANK_PREFERENCE_UNSPECIFIED	RankPreference value not set. Will use rank by POPULARITY by default.
DISTANCE	Ranks results by distance.
POPULARITY	Ranks results by popularity.
SearchNearbyResponse

Response proto for Search Nearby.

Fields
places[]	
Place

A list of places that meets user's requirements like places types, number of places and specific location restriction.
routing_summaries[]	
RoutingSummary

A list of routing summaries where each entry associates to the corresponding place in the same index in the places field. If the routing summary is not available for one of the places, it will contain an empty entry. This list should have as many entries as the list of places if requested.
SearchTextRequest

Request proto for SearchText.

Fields
text_query	
string

Required. The text query for textual search.
language_code	
string

Place details will be displayed with the preferred language if available. If the language code is unspecified or unrecognized, place details of any language may be returned, with a preference for English if such details exist.

Current list of supported languages: https://developers.google.com/maps/faq#languagesupport.
region_code	
string

The Unicode country/region code (CLDR) of the location where the request is coming from. This parameter is used to display the place details, like region-specific place name, if available. The parameter can affect results based on applicable law.

For more information, see https://www.unicode.org/cldr/charts/latest/supplemental/territory_language_information.html.

Note that 3-digit region codes are not currently supported.
rank_preference	
RankPreference

How results will be ranked in the response.
included_type	
string

The requested place type. Full list of types supported: https://developers.google.com/maps/documentation/places/web-service/place-types. Only support one included type.
open_now	
bool

Used to restrict the search to places that are currently open. The default is false.
min_rating	
double

Filter out results whose average user rating is strictly less than this limit. A valid value must be a float between 0 and 5 (inclusively) at a 0.5 cadence i.e. [0, 0.5, 1.0, ... , 5.0] inclusively. The input rating will round up to the nearest 0.5(ceiling). For instance, a rating of 0.6 will eliminate all results with a less than 1.0 rating.
max_result_count
(deprecated)	
int32

This item is deprecated!
Deprecated: Use page_size instead.

The maximum number of results per page that can be returned. If the number of available results is larger than max_result_count, a next_page_token is returned which can be passed to page_token to get the next page of results in subsequent requests. If 0 or no value is provided, a default of 20 is used. The maximum value is 20; values above 20 will be coerced to 20. Negative values will return an INVALID_ARGUMENT error.

If both max_result_count and page_size are specified, max_result_count will be ignored.
page_size	
int32

Optional. The maximum number of results per page that can be returned. If the number of available results is larger than page_size, a next_page_token is returned which can be passed to page_token to get the next page of results in subsequent requests. If 0 or no value is provided, a default of 20 is used. The maximum value is 20; values above 20 will be set to 20. Negative values will return an INVALID_ARGUMENT error.

If both max_result_count and page_size are specified, max_result_count will be ignored.
page_token	
string

Optional. A page token, received from a previous TextSearch call. Provide this to retrieve the subsequent page.

When paginating, all parameters other than page_token, page_size, and max_result_count provided to TextSearch must match the initial call that provided the page token. Otherwise an INVALID_ARGUMENT error is returned.
price_levels[]	
PriceLevel

Used to restrict the search to places that are marked as certain price levels. Users can choose any combinations of price levels. Default to select all price levels.
strict_type_filtering	
bool

Used to set strict type filtering for included_type. If set to true, only results of the same type will be returned. Default to false.
location_bias	
LocationBias

The region to search. This location serves as a bias which means results around given location might be returned. Cannot be set along with location_restriction.
location_restriction	
LocationRestriction

The region to search. This location serves as a restriction which means results outside given location will not be returned. Cannot be set along with location_bias.
ev_options	
EVOptions

Optional. Set the searchable EV options of a place search request.
routing_parameters	
RoutingParameters

Optional. Additional parameters for routing to results.
search_along_route_parameters	
SearchAlongRouteParameters

Optional. Additional parameters proto for searching along a route.
include_pure_service_area_businesses	
bool

Optional. Include pure service area businesses if the field is set to true. Pure service area business is a business that visits or delivers to customers directly but does not serve customers at their business address. For example, businesses like cleaning services or plumbers. Those businesses do not have a physical address or location on Google Maps. Places will not return fields including location, plus_code, and other location related fields for these businesses.
EVOptions

Searchable EV options of a place search request.

Fields
minimum_charging_rate_kw	
double

Optional. Minimum required charging rate in kilowatts. A place with a charging rate less than the specified rate is filtered out.
connector_types[]	
EVConnectorType

Optional. The list of preferred EV connector types. A place that does not support any of the listed connector types is filtered out.
LocationBias

The region to search. This location serves as a bias which means results around given location might be returned.

Fields
Union field type.

type can be only one of the following:
rectangle	
Viewport

A rectangle box defined by northeast and southwest corner. rectangle.high() must be the northeast point of the rectangle viewport. rectangle.low() must be the southwest point of the rectangle viewport. rectangle.low().latitude() cannot be greater than rectangle.high().latitude(). This will result in an empty latitude range. A rectangle viewport cannot be wider than 180 degrees.
circle	
Circle

A circle defined by center point and radius.
LocationRestriction

The region to search. This location serves as a restriction which means results outside given location will not be returned.

Fields
Union field type.

type can be only one of the following:
rectangle	
Viewport

A rectangle box defined by northeast and southwest corner. rectangle.high() must be the northeast point of the rectangle viewport. rectangle.low() must be the southwest point of the rectangle viewport. rectangle.low().latitude() cannot be greater than rectangle.high().latitude(). This will result in an empty latitude range. A rectangle viewport cannot be wider than 180 degrees.
RankPreference

How results will be ranked in the response.

Enums
RANK_PREFERENCE_UNSPECIFIED	For a categorical query such as "Restaurants in New York City", RELEVANCE is the default. For non-categorical queries such as "Mountain View, CA" we recommend that you leave rankPreference unset.
DISTANCE	Ranks results by distance.
RELEVANCE	Ranks results by relevance. Sort order determined by normal ranking stack.
SearchAlongRouteParameters

Specifies a precalculated polyline from the Routes API defining the route to search. Searching along a route is similar to using the locationBias or locationRestriction request option to bias the search results. However, while the locationBias and locationRestriction options let you specify a region to bias the search results, this option lets you bias the results along a trip route.

Results are not guaranteed to be along the route provided, but rather are ranked within the search area defined by the polyline and, optionally, by the locationBias or locationRestriction based on minimal detour times from origin to destination. The results might be along an alternate route, especially if the provided polyline does not define an optimal route from origin to destination.

Fields
polyline	
Polyline

Required. The route polyline.
SearchTextResponse

Response proto for SearchText.

Fields
places[]	
Place

A list of places that meet the user's text search criteria.
routing_summaries[]	
RoutingSummary

A list of routing summaries where each entry associates to the corresponding place in the same index in the places field. If the routing summary is not available for one of the places, it will contain an empty entry. This list will have as many entries as the list of places if requested.
contextual_contents[]	
ContextualContent

Experimental: See https://developers.google.com/maps/documentation/places/web-service/experimental/places-generative for more details.

A list of contextual contents where each entry associates to the corresponding place in the same index in the places field. The contents that are relevant to the text_query in the request are preferred. If the contextual content is not available for one of the places, it will return non-contextual content. It will be empty only when the content is unavailable for this place. This list will have as many entries as the list of places if requested.
next_page_token	
string

A token that can be sent as page_token to retrieve the next page. If this field is omitted or empty, there are no subsequent pages.
search_uri	
string

A link allows the user to search with the same text query as specified in the request on Google Maps.
TravelMode

Travel mode options. These options map to what Routes API offers.

Enums
TRAVEL_MODE_UNSPECIFIED	No travel mode specified. Defaults to DRIVE.
DRIVE	Travel by passenger car.
BICYCLE	Travel by bicycle. Not supported with search_along_route_parameters.
WALK	Travel by walking. Not supported with search_along_route_parameters.
TWO_WHEELER	Motorized two wheeled vehicles of all kinds such as scooters and motorcycles. Note that this is distinct from the BICYCLE travel mode which covers human-powered transport. Not supported with search_along_route_parameters. Only supported in those countries listed at Countries and regions supported for two-wheeled vehicles.
