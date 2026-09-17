
# PlaylistItemDto


## Properties

Name | Type
------------ | -------------
`kind` | [PlaylistItemKind](PlaylistItemKind.md)
`id` | string
`name` | string
`imageUrl` | string
`trackCount` | number
`externalUrl` | string
`owner` | string
`slug` | string
`source` | string
`origin` | string
`pending` | boolean
`staleSince` | Date
`refreshedAt` | Date
`refreshing` | boolean

## Example

```typescript
import type { PlaylistItemDto } from ''

// TODO: Update the object below with actual values
const example = {
  "kind": null,
  "id": null,
  "name": null,
  "imageUrl": null,
  "trackCount": null,
  "externalUrl": null,
  "owner": null,
  "slug": null,
  "source": null,
  "origin": null,
  "pending": null,
  "staleSince": null,
  "refreshedAt": null,
  "refreshing": null,
} satisfies PlaylistItemDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PlaylistItemDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


