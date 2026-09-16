
# ArtistRequestDto


## Properties

Name | Type
------------ | -------------
`key` | string
`name` | string
`count` | number
`lastAskedAt` | Date
`resolved` | boolean

## Example

```typescript
import type { ArtistRequestDto } from ''

// TODO: Update the object below with actual values
const example = {
  "key": null,
  "name": null,
  "count": null,
  "lastAskedAt": null,
  "resolved": null,
} satisfies ArtistRequestDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ArtistRequestDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


