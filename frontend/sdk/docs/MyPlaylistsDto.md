
# MyPlaylistsDto


## Properties

Name | Type
------------ | -------------
`items` | [Array&lt;PlaylistItemDto&gt;](PlaylistItemDto.md)
`spotifyUnavailable` | boolean

## Example

```typescript
import type { MyPlaylistsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "items": null,
  "spotifyUnavailable": null,
} satisfies MyPlaylistsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MyPlaylistsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


