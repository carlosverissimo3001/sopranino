
# ImportedSetDto


## Properties

Name | Type
------------ | -------------
`id` | string
`type` | string
`name` | string
`slug` | string
`trackCount` | number
`imageUrl` | string
`source` | string
`externalUrl` | string
`pending` | boolean
`staleSince` | Date

## Example

```typescript
import type { ImportedSetDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "type": null,
  "name": 1980s,
  "slug": 1980s,
  "trackCount": 490,
  "imageUrl": null,
  "source": null,
  "externalUrl": null,
  "pending": null,
  "staleSince": null,
} satisfies ImportedSetDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ImportedSetDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


