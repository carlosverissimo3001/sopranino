
# GauntletHistoryEntryDto


## Properties

Name | Type
------------ | -------------
`id` | string
`date` | string
`score` | number
`difficulty` | string
`source` | string
`tracks` | [Array&lt;TrackEntity&gt;](TrackEntity.md)
`durationSeconds` | number

## Example

```typescript
import type { GauntletHistoryEntryDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "date": null,
  "score": null,
  "difficulty": null,
  "source": null,
  "tracks": null,
  "durationSeconds": null,
} satisfies GauntletHistoryEntryDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GauntletHistoryEntryDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


