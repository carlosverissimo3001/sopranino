
# UpdateUserPreferenceDto


## Properties

Name | Type
------------ | -------------
`showAlbumHint` | boolean
`showTextHints` | boolean
`showGuessHistory` | boolean
`showStatsToOthers` | boolean
`timezone` | string

## Example

```typescript
import type { UpdateUserPreferenceDto } from ''

// TODO: Update the object below with actual values
const example = {
  "showAlbumHint": null,
  "showTextHints": null,
  "showGuessHistory": null,
  "showStatsToOthers": null,
  "timezone": null,
} satisfies UpdateUserPreferenceDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateUserPreferenceDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


