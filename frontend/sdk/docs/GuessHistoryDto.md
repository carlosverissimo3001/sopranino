
# GuessHistoryDto


## Properties

Name | Type
------------ | -------------
`trackId` | string
`trackName` | string
`artistName` | string
`albumName` | string
`result` | string
`audio` | [GuessAudioDto](GuessAudioDto.md)

## Example

```typescript
import type { GuessHistoryDto } from ''

// TODO: Update the object below with actual values
const example = {
  "trackId": null,
  "trackName": null,
  "artistName": null,
  "albumName": null,
  "result": null,
  "audio": null,
} satisfies GuessHistoryDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GuessHistoryDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


