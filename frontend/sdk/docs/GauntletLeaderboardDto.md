
# GauntletLeaderboardDto


## Properties

Name | Type
------------ | -------------
`entries` | [Array&lt;GauntletLeaderboardEntryDto&gt;](GauntletLeaderboardEntryDto.md)
`userEntry` | [GauntletUserLeaderboardEntryDto](GauntletUserLeaderboardEntryDto.md)
`period` | string
`difficulty` | string

## Example

```typescript
import type { GauntletLeaderboardDto } from ''

// TODO: Update the object below with actual values
const example = {
  "entries": null,
  "userEntry": null,
  "period": null,
  "difficulty": null,
} satisfies GauntletLeaderboardDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GauntletLeaderboardDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


