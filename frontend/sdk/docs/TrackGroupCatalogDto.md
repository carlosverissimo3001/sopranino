
# TrackGroupCatalogDto


## Properties

Name | Type
------------ | -------------
`artist` | [Array&lt;TrackGroupDto&gt;](TrackGroupDto.md)
`decade` | [Array&lt;TrackGroupDto&gt;](TrackGroupDto.md)
`genre` | [Array&lt;TrackGroupDto&gt;](TrackGroupDto.md)
`chart` | [Array&lt;TrackGroupDto&gt;](TrackGroupDto.md)
`special` | [Array&lt;TrackGroupDto&gt;](TrackGroupDto.md)

## Example

```typescript
import type { TrackGroupCatalogDto } from ''

// TODO: Update the object below with actual values
const example = {
  "artist": null,
  "decade": null,
  "genre": null,
  "chart": null,
  "special": null,
} satisfies TrackGroupCatalogDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TrackGroupCatalogDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


