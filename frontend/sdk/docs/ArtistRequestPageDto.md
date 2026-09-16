
# ArtistRequestPageDto


## Properties

Name | Type
------------ | -------------
`items` | [Array&lt;ArtistRequestDto&gt;](ArtistRequestDto.md)
`meta` | [PaginationMetaDto](PaginationMetaDto.md)

## Example

```typescript
import type { ArtistRequestPageDto } from ''

// TODO: Update the object below with actual values
const example = {
  "items": null,
  "meta": null,
} satisfies ArtistRequestPageDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ArtistRequestPageDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


