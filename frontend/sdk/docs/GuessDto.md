
# GuessDto


## Properties

Name | Type
------------ | -------------
`trackId` | string
`skip` | boolean
`trackName` | string
`artistName` | string
`isrc` | string
`albumName` | string
`audio` | [GuessAudioDto](GuessAudioDto.md)

## Example

```typescript
import type { GuessDto } from ''

// TODO: Update the object below with actual values
const example = {
  "trackId": null,
  "skip": null,
  "trackName": null,
  "artistName": null,
  "isrc": null,
  "albumName": null,
  "audio": null,
} satisfies GuessDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GuessDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


