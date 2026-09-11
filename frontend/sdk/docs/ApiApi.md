# ApiApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminControllerCreateStreakQuestion**](ApiApi.md#admincontrollercreatestreakquestion) | **POST** /admin/streak-questions | Create a streak quiz question |
| [**adminControllerDeleteStreakQuestion**](ApiApi.md#admincontrollerdeletestreakquestion) | **DELETE** /admin/streak-questions/{id} | Soft-delete a streak quiz question |
| [**adminControllerListStreakQuestions**](ApiApi.md#admincontrollerliststreakquestions) | **GET** /admin/streak-questions | List all streak quiz questions |
| [**adminControllerListUsers**](ApiApi.md#admincontrollerlistusers) | **GET** /admin/users | List all users |
| [**adminControllerUpdateStreakQuestion**](ApiApi.md#admincontrollerupdatestreakquestion) | **PATCH** /admin/streak-questions/{id} | Update a streak quiz question |
| [**adminControllerUpdateUserRole**](ApiApi.md#admincontrollerupdateuserrole) | **PATCH** /admin/users/{id} | Update user role flags |
| [**authControllerCallback**](ApiApi.md#authcontrollercallback) | **GET** /auth/callback | Handle Spotify OAuth callback |
| [**authControllerChangePassword**](ApiApi.md#authcontrollerchangepassword) | **POST** /auth/password | Change the password of the signed in account |
| [**authControllerConfirmEmail**](ApiApi.md#authcontrollerconfirmemail) | **POST** /auth/verify-email/confirm | Spend a verification link |
| [**authControllerConfirmPasswordReset**](ApiApi.md#authcontrollerconfirmpasswordreset) | **POST** /auth/password-reset/confirm | Spend a reset link and set a new password |
| [**authControllerEnsureSession**](ApiApi.md#authcontrollerensuresession) | **POST** /auth/session | Ensure the caller has an identity, minting one if they have none |
| [**authControllerLogin**](ApiApi.md#authcontrollerlogin) | **GET** /auth/login | Start Spotify OAuth flow |
| [**authControllerLoginWithPassword**](ApiApi.md#authcontrollerloginwithpassword) | **POST** /auth/signin | Sign in with an email and password |
| [**authControllerLogout**](ApiApi.md#authcontrollerlogout) | **POST** /auth/logout | Logout and clear session |
| [**authControllerMe**](ApiApi.md#authcontrollerme) | **GET** /auth/me | Get current authenticated user |
| [**authControllerRequestPasswordReset**](ApiApi.md#authcontrollerrequestpasswordreset) | **POST** /auth/password-reset | Ask for a link to choose a new password |
| [**authControllerResendVerification**](ApiApi.md#authcontrollerresendverification) | **POST** /auth/verify-email/resend | Send the verification link again |
| [**authControllerSignup**](ApiApi.md#authcontrollersignup) | **POST** /auth/signup | Create an account, keeping any guest progress |
| [**authControllerUpdateMe**](ApiApi.md#authcontrollerupdateme) | **PATCH** /auth/me | Update current user profile |
| [**gameControllerGetGameState**](ApiApi.md#gamecontrollergetgamestate) | **GET** /game/{id} | Get current game state |
| [**gameControllerGetHistory**](ApiApi.md#gamecontrollergethistory) | **GET** /game/history | Get user\&#39;s game session history (paginated) |
| [**gameControllerGetPlayedToday**](ApiApi.md#gamecontrollergetplayedtoday) | **GET** /game/daily/played-today | Whether the user has played today\&#39;s daily |
| [**gameControllerGetShare**](ApiApi.md#gamecontrollergetshare) | **GET** /game/share/{id} | Get shareable result for a game session |
| [**gameControllerGetStats**](ApiApi.md#gamecontrollergetstats) | **GET** /game/stats | Get user\&#39;s daily stats |
| [**gameControllerStartGame**](ApiApi.md#gamecontrollerstartgame) | **POST** /game/start | Start a new game from a playlist or daily |
| [**gameControllerSubmitGuess**](ApiApi.md#gamecontrollersubmitguess) | **POST** /game/{id}/guess | Submit a guess for a specific session |
| [**gauntletControllerEndRun**](ApiApi.md#gauntletcontrollerendrun) | **POST** /gauntlet/{id}/end | Voluntarily end a gauntlet run (quit) |
| [**gauntletControllerGetHistory**](ApiApi.md#gauntletcontrollergethistory) | **GET** /gauntlet/history | Get user\&#39;s gauntlet run history (paginated) |
| [**gauntletControllerGetLeaderboard**](ApiApi.md#gauntletcontrollergetleaderboard) | **GET** /gauntlet/leaderboard | Get gauntlet leaderboard |
| [**gauntletControllerGetPersonalBest**](ApiApi.md#gauntletcontrollergetpersonalbest) | **GET** /gauntlet/personal-best | Get user\&#39;s gauntlet personal best |
| [**gauntletControllerGetRunState**](ApiApi.md#gauntletcontrollergetrunstate) | **GET** /gauntlet/{id} | Get current gauntlet run state |
| [**gauntletControllerStartRun**](ApiApi.md#gauntletcontrollerstartrun) | **POST** /gauntlet/start | Start a new gauntlet run |
| [**gauntletControllerSubmitGuess**](ApiApi.md#gauntletcontrollersubmitguess) | **POST** /gauntlet/{id}/guess | Submit a guess for the current gauntlet track |
| [**multiplayerControllerCreateRoom**](ApiApi.md#multiplayercontrollercreateroom) | **POST** /multiplayer/rooms | Create a new multiplayer room |
| [**multiplayerControllerGetRoomState**](ApiApi.md#multiplayercontrollergetroomstate) | **GET** /multiplayer/rooms/{id} | Get room state with players |
| [**multiplayerControllerGetRoundState**](ApiApi.md#multiplayercontrollergetroundstate) | **GET** /multiplayer/rooms/{id}/round | Get current round state for the player |
| [**multiplayerControllerGetScoreboard**](ApiApi.md#multiplayercontrollergetscoreboard) | **GET** /multiplayer/rooms/{id}/scoreboard | Get scoreboard (only completed rounds visible) |
| [**multiplayerControllerJoinOpenRoom**](ApiApi.md#multiplayercontrollerjoinopenroom) | **POST** /multiplayer/rooms/{id}/open-join | Join a findable room from the lobby |
| [**multiplayerControllerJoinRoom**](ApiApi.md#multiplayercontrollerjoinroom) | **POST** /multiplayer/rooms/{code}/join | Join a room by invite code |
| [**multiplayerControllerKickPlayer**](ApiApi.md#multiplayercontrollerkickplayer) | **POST** /multiplayer/rooms/{id}/kick | Remove a player from the room (host only) |
| [**multiplayerControllerLeaveRoom**](ApiApi.md#multiplayercontrollerleaveroom) | **POST** /multiplayer/rooms/{id}/leave | Leave a room (host leaving expires it) |
| [**multiplayerControllerListOpenRooms**](ApiApi.md#multiplayercontrollerlistopenrooms) | **GET** /multiplayer/rooms/open | Rooms waiting for players that anyone may join |
| [**multiplayerControllerSetTrackSource**](ApiApi.md#multiplayercontrollersettracksource) | **POST** /multiplayer/rooms/{id}/track-source | Choose where the room draws its songs from |
| [**multiplayerControllerStartGame**](ApiApi.md#multiplayercontrollerstartgame) | **POST** /multiplayer/rooms/{id}/start | Start the game (host only) |
| [**multiplayerControllerSubmitGuess**](ApiApi.md#multiplayercontrollersubmitguess) | **POST** /multiplayer/rooms/{id}/guess | Submit a guess for the current round |
| [**multiplayerControllerToggleReady**](ApiApi.md#multiplayercontrollertoggleready) | **POST** /multiplayer/rooms/{id}/ready | Toggle ready status for current player |
| [**multiplayerControllerUpdateRoomSettings**](ApiApi.md#multiplayercontrollerupdateroomsettings) | **PATCH** /multiplayer/rooms/{id}/settings | Rename a room or change whether it is listed |
| [**playlistControllerGetMyPlaylists**](ApiApi.md#playlistcontrollergetmyplaylists) | **GET** /playlists/me | Get current user\&#39;s playlists |
| [**playlistControllerGetPlaylistById**](ApiApi.md#playlistcontrollergetplaylistbyid) | **GET** /playlists/{id} | Get playlist by ID |
| [**searchControllerSearchTracks**](ApiApi.md#searchcontrollersearchtracks) | **GET** /search/tracks | Search tracks (for game guess options) |
| [**streakControllerGetNextQuestion**](ApiApi.md#streakcontrollergetnextquestion) | **GET** /streak/quiz/next | Get the next unanswered quiz question |
| [**streakControllerGetStatus**](ApiApi.md#streakcontrollergetstatus) | **GET** /streak/status | Get streak status including freeze info |
| [**streakControllerSubmitAnswer**](ApiApi.md#streakcontrollersubmitanswer) | **POST** /streak/quiz/answer | Submit a quiz answer to earn a streak freeze |
| [**streakControllerUseFreeze**](ApiApi.md#streakcontrollerusefreeze) | **POST** /streak/use-freeze | Apply streak freezes to bridge a gap |
| [**trackGroupControllerBySlug**](ApiApi.md#trackgroupcontrollerbyslug) | **GET** /track-groups/{slug} | One group, by the name in its URL |
| [**trackGroupControllerList**](ApiApi.md#trackgroupcontrollerlist) | **GET** /track-groups | Curated sets of songs anyone can play, library or not |
| [**userAvatarControllerUpdateSource**](ApiApi.md#useravatarcontrollerupdatesource) | **PATCH** /user-avatar/source | Switch between Spotify and custom avatar |
| [**userAvatarControllerUpload**](ApiApi.md#useravatarcontrollerupload) | **POST** /user-avatar/upload | Upload a custom avatar image |
| [**userPreferencesControllerGet**](ApiApi.md#userpreferencescontrollerget) | **GET** /user-preferences | Get user preferences |
| [**userPreferencesControllerUpdate**](ApiApi.md#userpreferencescontrollerupdate) | **PATCH** /user-preferences | Update user preferences |



## adminControllerCreateStreakQuestion

> StreakQuestionDto adminControllerCreateStreakQuestion(createStreakQuestionDto)

Create a streak quiz question

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AdminControllerCreateStreakQuestionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // CreateStreakQuestionDto
    createStreakQuestionDto: ...,
  } satisfies AdminControllerCreateStreakQuestionRequest;

  try {
    const data = await api.adminControllerCreateStreakQuestion(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **createStreakQuestionDto** | [CreateStreakQuestionDto](CreateStreakQuestionDto.md) |  | |

### Return type

[**StreakQuestionDto**](StreakQuestionDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerDeleteStreakQuestion

> adminControllerDeleteStreakQuestion(id)

Soft-delete a streak quiz question

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AdminControllerDeleteStreakQuestionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminControllerDeleteStreakQuestionRequest;

  try {
    const data = await api.adminControllerDeleteStreakQuestion(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerListStreakQuestions

> Array&lt;StreakQuestionDto&gt; adminControllerListStreakQuestions()

List all streak quiz questions

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AdminControllerListStreakQuestionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.adminControllerListStreakQuestions();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**Array&lt;StreakQuestionDto&gt;**](StreakQuestionDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerListUsers

> Array&lt;AdminUserDto&gt; adminControllerListUsers()

List all users

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AdminControllerListUsersRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.adminControllerListUsers();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**Array&lt;AdminUserDto&gt;**](AdminUserDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerUpdateStreakQuestion

> StreakQuestionDto adminControllerUpdateStreakQuestion(id, updateStreakQuestionDto)

Update a streak quiz question

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AdminControllerUpdateStreakQuestionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
    // UpdateStreakQuestionDto
    updateStreakQuestionDto: ...,
  } satisfies AdminControllerUpdateStreakQuestionRequest;

  try {
    const data = await api.adminControllerUpdateStreakQuestion(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |
| **updateStreakQuestionDto** | [UpdateStreakQuestionDto](UpdateStreakQuestionDto.md) |  | |

### Return type

[**StreakQuestionDto**](StreakQuestionDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerUpdateUserRole

> AdminUserDto adminControllerUpdateUserRole(id, updateUserRoleDto)

Update user role flags

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AdminControllerUpdateUserRoleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
    // UpdateUserRoleDto
    updateUserRoleDto: ...,
  } satisfies AdminControllerUpdateUserRoleRequest;

  try {
    const data = await api.adminControllerUpdateUserRole(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |
| **updateUserRoleDto** | [UpdateUserRoleDto](UpdateUserRoleDto.md) |  | |

### Return type

[**AdminUserDto**](AdminUserDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerCallback

> authControllerCallback(code, state, error, ubi)

Handle Spotify OAuth callback

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerCallbackRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // string | Authorization code from Spotify
    code: code_example,
    // string | State parameter for CSRF protection
    state: state_example,
    // object | Error message if authorization failed. (optional)
    error: Object,
    // object | Spotify-specific parameter added during OAuth flow (optional)
    ubi: Object,
  } satisfies AuthControllerCallbackRequest;

  try {
    const data = await api.authControllerCallback(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **code** | `string` | Authorization code from Spotify | [Defaults to `undefined`] |
| **state** | `string` | State parameter for CSRF protection | [Defaults to `undefined`] |
| **error** | `object` | Error message if authorization failed. | [Optional] [Defaults to `undefined`] |
| **ubi** | `object` | Spotify-specific parameter added during OAuth flow | [Optional] [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **302** | Redirects to frontend after auth |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerChangePassword

> authControllerChangePassword(changePasswordDto)

Change the password of the signed in account

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerChangePasswordRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // ChangePasswordDto
    changePasswordDto: ...,
  } satisfies AuthControllerChangePasswordRequest;

  try {
    const data = await api.authControllerChangePassword(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **changePasswordDto** | [ChangePasswordDto](ChangePasswordDto.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Password changed |  -  |
| **401** | Current password is incorrect |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerConfirmEmail

> EmailVerificationResultDto authControllerConfirmEmail(confirmEmailDto)

Spend a verification link

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerConfirmEmailRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // ConfirmEmailDto
    confirmEmailDto: ...,
  } satisfies AuthControllerConfirmEmailRequest;

  try {
    const data = await api.authControllerConfirmEmail(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **confirmEmailDto** | [ConfirmEmailDto](ConfirmEmailDto.md) |  | |

### Return type

[**EmailVerificationResultDto**](EmailVerificationResultDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerConfirmPasswordReset

> PasswordResetResultDto authControllerConfirmPasswordReset(confirmPasswordResetDto)

Spend a reset link and set a new password

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerConfirmPasswordResetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // ConfirmPasswordResetDto
    confirmPasswordResetDto: ...,
  } satisfies AuthControllerConfirmPasswordResetRequest;

  try {
    const data = await api.authControllerConfirmPasswordReset(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **confirmPasswordResetDto** | [ConfirmPasswordResetDto](ConfirmPasswordResetDto.md) |  | |

### Return type

[**PasswordResetResultDto**](PasswordResetResultDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerEnsureSession

> AuthMeResponseDto authControllerEnsureSession()

Ensure the caller has an identity, minting one if they have none

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerEnsureSessionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  try {
    const data = await api.authControllerEnsureSession();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**AuthMeResponseDto**](AuthMeResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerLogin

> authControllerLogin()

Start Spotify OAuth flow

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerLoginRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  try {
    const data = await api.authControllerLogin();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **302** | Redirects to Spotify authorization |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerLoginWithPassword

> AuthMeResponseDto authControllerLoginWithPassword(loginDto)

Sign in with an email and password

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerLoginWithPasswordRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // LoginDto
    loginDto: ...,
  } satisfies AuthControllerLoginWithPasswordRequest;

  try {
    const data = await api.authControllerLoginWithPassword(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **loginDto** | [LoginDto](LoginDto.md) |  | |

### Return type

[**AuthMeResponseDto**](AuthMeResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **401** | Email or password is incorrect |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerLogout

> authControllerLogout()

Logout and clear session

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerLogoutRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.authControllerLogout();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successfully logged out |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerMe

> AuthMeResponseDto authControllerMe()

Get current authenticated user

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerMeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.authControllerMe();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**AuthMeResponseDto**](AuthMeResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerRequestPasswordReset

> authControllerRequestPasswordReset(requestPasswordResetDto)

Ask for a link to choose a new password

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerRequestPasswordResetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // RequestPasswordResetDto
    requestPasswordResetDto: ...,
  } satisfies AuthControllerRequestPasswordResetRequest;

  try {
    const data = await api.authControllerRequestPasswordReset(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **requestPasswordResetDto** | [RequestPasswordResetDto](RequestPasswordResetDto.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **202** | Accepted, and deliberately says nothing else. An unknown address, an unverified one and a Spotify-only account all get this same answer, so the endpoint cannot be used to find out which addresses are registered. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerResendVerification

> authControllerResendVerification()

Send the verification link again

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerResendVerificationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.authControllerResendVerification();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **202** | Accepted. Says nothing about whether a mail went out: an address that is already verified, or being sent to too often, gets this same answer. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerSignup

> AuthMeResponseDto authControllerSignup(signupDto)

Create an account, keeping any guest progress

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerSignupRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // SignupDto
    signupDto: ...,
  } satisfies AuthControllerSignupRequest;

  try {
    const data = await api.authControllerSignup(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **signupDto** | [SignupDto](SignupDto.md) |  | |

### Return type

[**AuthMeResponseDto**](AuthMeResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |
| **409** | That email is already registered |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerUpdateMe

> AuthMeResponseDto authControllerUpdateMe(patchUserDto)

Update current user profile

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerUpdateMeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // PatchUserDto
    patchUserDto: ...,
  } satisfies AuthControllerUpdateMeRequest;

  try {
    const data = await api.authControllerUpdateMe(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **patchUserDto** | [PatchUserDto](PatchUserDto.md) |  | |

### Return type

[**AuthMeResponseDto**](AuthMeResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerGetGameState

> GameStateDto gameControllerGetGameState(id)

Get current game state

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerGetGameStateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | The internal Game Session UUID
    id: id_example,
  } satisfies GameControllerGetGameStateRequest;

  try {
    const data = await api.gameControllerGetGameState(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | The internal Game Session UUID | [Defaults to `undefined`] |

### Return type

[**GameStateDto**](GameStateDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerGetHistory

> GameHistoryDto gameControllerGetHistory(page, limit, mode, search, status, from, to)

Get user\&#39;s game session history (paginated)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerGetHistoryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // number (optional)
    page: 8.14,
    // number (optional)
    limit: 8.14,
    // 'DAILY' | 'ALL' | 'MULTIPLAYER' | 'GAUNTLET' | The game mode to filter history by (e.g. daily, all) (optional)
    mode: mode_example,
    // string | Search by track name, artist name, or album name (optional)
    search: search_example,
    // Array<'PLAYING' | 'WON' | 'LOST' | 'ABANDONED'> | Filter by game status (optional)
    status: ...,
    // Date | Filter from date (ISO 8601) (optional)
    from: 2013-10-20T19:20:30+01:00,
    // Date | Filter to date (ISO 8601) (optional)
    to: 2013-10-20T19:20:30+01:00,
  } satisfies GameControllerGetHistoryRequest;

  try {
    const data = await api.gameControllerGetHistory(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **page** | `number` |  | [Optional] [Defaults to `1`] |
| **limit** | `number` |  | [Optional] [Defaults to `10`] |
| **mode** | `DAILY`, `ALL`, `MULTIPLAYER`, `GAUNTLET` | The game mode to filter history by (e.g. daily, all) | [Optional] [Defaults to `undefined`] [Enum: DAILY, ALL, MULTIPLAYER, GAUNTLET] |
| **search** | `string` | Search by track name, artist name, or album name | [Optional] [Defaults to `undefined`] |
| **status** | `PLAYING`, `WON`, `LOST`, `ABANDONED` | Filter by game status | [Optional] [Enum: PLAYING, WON, LOST, ABANDONED] |
| **from** | `Date` | Filter from date (ISO 8601) | [Optional] [Defaults to `undefined`] |
| **to** | `Date` | Filter to date (ISO 8601) | [Optional] [Defaults to `undefined`] |

### Return type

[**GameHistoryDto**](GameHistoryDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerGetPlayedToday

> PlayedTodayDto gameControllerGetPlayedToday()

Whether the user has played today\&#39;s daily

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerGetPlayedTodayRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.gameControllerGetPlayedToday();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**PlayedTodayDto**](PlayedTodayDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerGetShare

> ShareResultDto gameControllerGetShare(id)

Get shareable result for a game session

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerGetShareRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | Game session ID
    id: id_example,
  } satisfies GameControllerGetShareRequest;

  try {
    const data = await api.gameControllerGetShare(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | Game session ID | [Defaults to `undefined`] |

### Return type

[**ShareResultDto**](ShareResultDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerGetStats

> GameStatsDto gameControllerGetStats(mode)

Get user\&#39;s daily stats

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerGetStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // 'DAILY' | 'ALL' | 'MULTIPLAYER' | 'GAUNTLET' | The game mode
    mode: mode_example,
  } satisfies GameControllerGetStatsRequest;

  try {
    const data = await api.gameControllerGetStats(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **mode** | `DAILY`, `ALL`, `MULTIPLAYER`, `GAUNTLET` | The game mode | [Defaults to `undefined`] [Enum: DAILY, ALL, MULTIPLAYER, GAUNTLET] |

### Return type

[**GameStatsDto**](GameStatsDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerStartGame

> GameStateDto gameControllerStartGame(startGameDto)

Start a new game from a playlist or daily

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerStartGameRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // StartGameDto
    startGameDto: ...,
  } satisfies GameControllerStartGameRequest;

  try {
    const data = await api.gameControllerStartGame(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **startGameDto** | [StartGameDto](StartGameDto.md) |  | |

### Return type

[**GameStateDto**](GameStateDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerSubmitGuess

> GuessResultDto gameControllerSubmitGuess(id, guessDto)

Submit a guess for a specific session

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerSubmitGuessRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // string | The internal Game Session UUID
    id: id_example,
    // GuessDto
    guessDto: ...,
  } satisfies GameControllerSubmitGuessRequest;

  try {
    const data = await api.gameControllerSubmitGuess(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | The internal Game Session UUID | [Defaults to `undefined`] |
| **guessDto** | [GuessDto](GuessDto.md) |  | |

### Return type

[**GuessResultDto**](GuessResultDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **429** | Rate limit exceeded |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gauntletControllerEndRun

> GauntletRunStateDto gauntletControllerEndRun(id)

Voluntarily end a gauntlet run (quit)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GauntletControllerEndRunRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | The gauntlet run ID
    id: id_example,
  } satisfies GauntletControllerEndRunRequest;

  try {
    const data = await api.gauntletControllerEndRun(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | The gauntlet run ID | [Defaults to `undefined`] |

### Return type

[**GauntletRunStateDto**](GauntletRunStateDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gauntletControllerGetHistory

> GauntletHistoryDto gauntletControllerGetHistory(page, limit, difficulty)

Get user\&#39;s gauntlet run history (paginated)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GauntletControllerGetHistoryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // number (optional)
    page: 8.14,
    // number (optional)
    limit: 8.14,
    // 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | Filter by difficulty (optional)
    difficulty: difficulty_example,
  } satisfies GauntletControllerGetHistoryRequest;

  try {
    const data = await api.gauntletControllerGetHistory(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **page** | `number` |  | [Optional] [Defaults to `1`] |
| **limit** | `number` |  | [Optional] [Defaults to `10`] |
| **difficulty** | `EASY`, `MEDIUM`, `HARD`, `EXPERT` | Filter by difficulty | [Optional] [Defaults to `undefined`] [Enum: EASY, MEDIUM, HARD, EXPERT] |

### Return type

[**GauntletHistoryDto**](GauntletHistoryDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gauntletControllerGetLeaderboard

> GauntletLeaderboardDto gauntletControllerGetLeaderboard(period, limit, offset, difficulty)

Get gauntlet leaderboard

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GauntletControllerGetLeaderboardRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // 'daily' | 'weekly' | 'alltime' | Time period for the leaderboard (optional)
    period: period_example,
    // number (optional)
    limit: 8.14,
    // number (optional)
    offset: 8.14,
    // 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | Which board to read. A 7s run and a 1s run are not the same feat, so each difficulty ranks on its own. (optional)
    difficulty: difficulty_example,
  } satisfies GauntletControllerGetLeaderboardRequest;

  try {
    const data = await api.gauntletControllerGetLeaderboard(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **period** | `daily`, `weekly`, `alltime` | Time period for the leaderboard | [Optional] [Defaults to `&#39;alltime&#39;`] [Enum: daily, weekly, alltime] |
| **limit** | `number` |  | [Optional] [Defaults to `10`] |
| **offset** | `number` |  | [Optional] [Defaults to `0`] |
| **difficulty** | `EASY`, `MEDIUM`, `HARD`, `EXPERT` | Which board to read. A 7s run and a 1s run are not the same feat, so each difficulty ranks on its own. | [Optional] [Defaults to `&#39;MEDIUM&#39;`] [Enum: EASY, MEDIUM, HARD, EXPERT] |

### Return type

[**GauntletLeaderboardDto**](GauntletLeaderboardDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gauntletControllerGetPersonalBest

> PersonalBestDto gauntletControllerGetPersonalBest()

Get user\&#39;s gauntlet personal best

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GauntletControllerGetPersonalBestRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.gauntletControllerGetPersonalBest();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**PersonalBestDto**](PersonalBestDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gauntletControllerGetRunState

> GauntletRunStateDto gauntletControllerGetRunState(id)

Get current gauntlet run state

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GauntletControllerGetRunStateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | The gauntlet run ID
    id: id_example,
  } satisfies GauntletControllerGetRunStateRequest;

  try {
    const data = await api.gauntletControllerGetRunState(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | The gauntlet run ID | [Defaults to `undefined`] |

### Return type

[**GauntletRunStateDto**](GauntletRunStateDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gauntletControllerStartRun

> GauntletRunStateDto gauntletControllerStartRun(startRunDto)

Start a new gauntlet run

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GauntletControllerStartRunRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // StartRunDto
    startRunDto: ...,
  } satisfies GauntletControllerStartRunRequest;

  try {
    const data = await api.gauntletControllerStartRun(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **startRunDto** | [StartRunDto](StartRunDto.md) |  | |

### Return type

[**GauntletRunStateDto**](GauntletRunStateDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gauntletControllerSubmitGuess

> GauntletGuessResultDto gauntletControllerSubmitGuess(id, submitGauntletGuessDto)

Submit a guess for the current gauntlet track

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GauntletControllerSubmitGuessRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | The gauntlet run ID
    id: id_example,
    // SubmitGauntletGuessDto
    submitGauntletGuessDto: ...,
  } satisfies GauntletControllerSubmitGuessRequest;

  try {
    const data = await api.gauntletControllerSubmitGuess(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | The gauntlet run ID | [Defaults to `undefined`] |
| **submitGauntletGuessDto** | [SubmitGauntletGuessDto](SubmitGauntletGuessDto.md) |  | |

### Return type

[**GauntletGuessResultDto**](GauntletGuessResultDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **429** | Rate limit exceeded |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerCreateRoom

> RoomDto multiplayerControllerCreateRoom(createRoomControllerDto)

Create a new multiplayer room

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerCreateRoomRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // CreateRoomControllerDto
    createRoomControllerDto: ...,
  } satisfies MultiplayerControllerCreateRoomRequest;

  try {
    const data = await api.multiplayerControllerCreateRoom(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **createRoomControllerDto** | [CreateRoomControllerDto](CreateRoomControllerDto.md) |  | |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerGetRoomState

> RoomDto multiplayerControllerGetRoomState(id)

Get room state with players

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerGetRoomStateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies MultiplayerControllerGetRoomStateRequest;

  try {
    const data = await api.multiplayerControllerGetRoomState(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **403** | You are not in this room |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerGetRoundState

> MultiplayerRoundStateDto multiplayerControllerGetRoundState(id)

Get current round state for the player

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerGetRoundStateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies MultiplayerControllerGetRoundStateRequest;

  try {
    const data = await api.multiplayerControllerGetRoundState(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**MultiplayerRoundStateDto**](MultiplayerRoundStateDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerGetScoreboard

> ScoreboardDto multiplayerControllerGetScoreboard(id)

Get scoreboard (only completed rounds visible)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerGetScoreboardRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies MultiplayerControllerGetScoreboardRequest;

  try {
    const data = await api.multiplayerControllerGetScoreboard(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**ScoreboardDto**](ScoreboardDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerJoinOpenRoom

> RoomDto multiplayerControllerJoinOpenRoom(id)

Join a findable room from the lobby

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerJoinOpenRoomRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies MultiplayerControllerJoinOpenRoomRequest;

  try {
    const data = await api.multiplayerControllerJoinOpenRoom(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerJoinRoom

> RoomDto multiplayerControllerJoinRoom(code)

Join a room by invite code

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerJoinRoomRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    code: code_example,
  } satisfies MultiplayerControllerJoinRoomRequest;

  try {
    const data = await api.multiplayerControllerJoinRoom(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **code** | `string` |  | [Defaults to `undefined`] |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerKickPlayer

> RoomDto multiplayerControllerKickPlayer(id, kickPlayerDto)

Remove a player from the room (host only)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerKickPlayerRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
    // KickPlayerDto
    kickPlayerDto: ...,
  } satisfies MultiplayerControllerKickPlayerRequest;

  try {
    const data = await api.multiplayerControllerKickPlayer(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |
| **kickPlayerDto** | [KickPlayerDto](KickPlayerDto.md) |  | |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **403** | Only the host can remove players |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerLeaveRoom

> multiplayerControllerLeaveRoom(id)

Leave a room (host leaving expires it)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerLeaveRoomRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies MultiplayerControllerLeaveRoomRequest;

  try {
    const data = await api.multiplayerControllerLeaveRoom(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerListOpenRooms

> OpenRoomsDto multiplayerControllerListOpenRooms()

Rooms waiting for players that anyone may join

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerListOpenRoomsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  try {
    const data = await api.multiplayerControllerListOpenRooms();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**OpenRoomsDto**](OpenRoomsDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerSetTrackSource

> RoomDto multiplayerControllerSetTrackSource(id, setTrackSourceDto)

Choose where the room draws its songs from

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerSetTrackSourceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
    // SetTrackSourceDto
    setTrackSourceDto: ...,
  } satisfies MultiplayerControllerSetTrackSourceRequest;

  try {
    const data = await api.multiplayerControllerSetTrackSource(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |
| **setTrackSourceDto** | [SetTrackSourceDto](SetTrackSourceDto.md) |  | |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerStartGame

> RoomDto multiplayerControllerStartGame(id)

Start the game (host only)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerStartGameRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies MultiplayerControllerStartGameRequest;

  try {
    const data = await api.multiplayerControllerStartGame(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerSubmitGuess

> GuessResultDto multiplayerControllerSubmitGuess(id, guessDto)

Submit a guess for the current round

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerSubmitGuessRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
    // GuessDto
    guessDto: ...,
  } satisfies MultiplayerControllerSubmitGuessRequest;

  try {
    const data = await api.multiplayerControllerSubmitGuess(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |
| **guessDto** | [GuessDto](GuessDto.md) |  | |

### Return type

[**GuessResultDto**](GuessResultDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **429** | Rate limit exceeded |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerToggleReady

> RoomDto multiplayerControllerToggleReady(id)

Toggle ready status for current player

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerToggleReadyRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies MultiplayerControllerToggleReadyRequest;

  try {
    const data = await api.multiplayerControllerToggleReady(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerUpdateRoomSettings

> RoomDto multiplayerControllerUpdateRoomSettings(id, updateRoomSettingsControllerDto)

Rename a room or change whether it is listed

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerUpdateRoomSettingsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
    // UpdateRoomSettingsControllerDto
    updateRoomSettingsControllerDto: ...,
  } satisfies MultiplayerControllerUpdateRoomSettingsRequest;

  try {
    const data = await api.multiplayerControllerUpdateRoomSettings(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |
| **updateRoomSettingsControllerDto** | [UpdateRoomSettingsControllerDto](UpdateRoomSettingsControllerDto.md) |  | |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## playlistControllerGetMyPlaylists

> PlaylistsResponseDto playlistControllerGetMyPlaylists(limit, offset, onlyPublic, onlyPrivate, sortBy)

Get current user\&#39;s playlists

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { PlaylistControllerGetMyPlaylistsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // number (optional)
    limit: 20,
    // number (optional)
    offset: 0,
    // boolean | Include only public playlists (optional)
    onlyPublic: true,
    // boolean | Include only private playlists (optional)
    onlyPrivate: true,
    // 'default' | 'name' | 'tracks' | Sort playlists by field (optional)
    sortBy: sortBy_example,
  } satisfies PlaylistControllerGetMyPlaylistsRequest;

  try {
    const data = await api.playlistControllerGetMyPlaylists(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |
| **onlyPublic** | `boolean` | Include only public playlists | [Optional] [Defaults to `undefined`] |
| **onlyPrivate** | `boolean` | Include only private playlists | [Optional] [Defaults to `undefined`] |
| **sortBy** | `default`, `name`, `tracks` | Sort playlists by field | [Optional] [Defaults to `undefined`] [Enum: default, name, tracks] |

### Return type

[**PlaylistsResponseDto**](PlaylistsResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **401** | Not authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## playlistControllerGetPlaylistById

> PlaylistDto playlistControllerGetPlaylistById(id)

Get playlist by ID

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { PlaylistControllerGetPlaylistByIdRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies PlaylistControllerGetPlaylistByIdRequest;

  try {
    const data = await api.playlistControllerGetPlaylistById(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**PlaylistDto**](PlaylistDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **401** | Not authenticated |  -  |
| **404** | Playlist not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## searchControllerSearchTracks

> Array&lt;TrackOptionDto&gt; searchControllerSearchTracks(q)

Search tracks (for game guess options)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { SearchControllerSearchTracksRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // string
    q: q_example,
  } satisfies SearchControllerSearchTracksRequest;

  try {
    const data = await api.searchControllerSearchTracks(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **q** | `string` |  | [Defaults to `undefined`] |

### Return type

[**Array&lt;TrackOptionDto&gt;**](TrackOptionDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Track options |  -  |
| **429** | Rate limit exceeded |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## streakControllerGetNextQuestion

> QuizNextResponseDto streakControllerGetNextQuestion()

Get the next unanswered quiz question

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { StreakControllerGetNextQuestionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.streakControllerGetNextQuestion();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**QuizNextResponseDto**](QuizNextResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## streakControllerGetStatus

> StreakStatusDto streakControllerGetStatus()

Get streak status including freeze info

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { StreakControllerGetStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.streakControllerGetStatus();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**StreakStatusDto**](StreakStatusDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## streakControllerSubmitAnswer

> QuizResultDto streakControllerSubmitAnswer(submitQuizAnswerDto)

Submit a quiz answer to earn a streak freeze

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { StreakControllerSubmitAnswerRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // SubmitQuizAnswerDto
    submitQuizAnswerDto: ...,
  } satisfies StreakControllerSubmitAnswerRequest;

  try {
    const data = await api.streakControllerSubmitAnswer(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **submitQuizAnswerDto** | [SubmitQuizAnswerDto](SubmitQuizAnswerDto.md) |  | |

### Return type

[**QuizResultDto**](QuizResultDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## streakControllerUseFreeze

> StreakStatusDto streakControllerUseFreeze()

Apply streak freezes to bridge a gap

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { StreakControllerUseFreezeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.streakControllerUseFreeze();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**StreakStatusDto**](StreakStatusDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## trackGroupControllerBySlug

> TrackGroupDto trackGroupControllerBySlug(slug)

One group, by the name in its URL

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { TrackGroupControllerBySlugRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // string
    slug: slug_example,
  } satisfies TrackGroupControllerBySlugRequest;

  try {
    const data = await api.trackGroupControllerBySlug(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **slug** | `string` |  | [Defaults to `undefined`] |

### Return type

[**TrackGroupDto**](TrackGroupDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | No such group, or not for you |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## trackGroupControllerList

> Array&lt;TrackGroupDto&gt; trackGroupControllerList(type)

Curated sets of songs anyone can play, library or not

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { TrackGroupControllerListRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // 'DECADE' | 'GENRE' | 'FAME' | 'CHART' | 'SPECIAL' | Which axis to list. Only DECADE is populated today. (optional)
    type: type_example,
  } satisfies TrackGroupControllerListRequest;

  try {
    const data = await api.trackGroupControllerList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **type** | `DECADE`, `GENRE`, `FAME`, `CHART`, `SPECIAL` | Which axis to list. Only DECADE is populated today. | [Optional] [Defaults to `undefined`] [Enum: DECADE, GENRE, FAME, CHART, SPECIAL] |

### Return type

[**Array&lt;TrackGroupDto&gt;**](TrackGroupDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## userAvatarControllerUpdateSource

> UploadAvatarResponseDto userAvatarControllerUpdateSource(updateAvatarSourceDto)

Switch between Spotify and custom avatar

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { UserAvatarControllerUpdateSourceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // UpdateAvatarSourceDto
    updateAvatarSourceDto: ...,
  } satisfies UserAvatarControllerUpdateSourceRequest;

  try {
    const data = await api.userAvatarControllerUpdateSource(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **updateAvatarSourceDto** | [UpdateAvatarSourceDto](UpdateAvatarSourceDto.md) |  | |

### Return type

[**UploadAvatarResponseDto**](UploadAvatarResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## userAvatarControllerUpload

> UploadAvatarResponseDto userAvatarControllerUpload(file)

Upload a custom avatar image

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { UserAvatarControllerUploadRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // Blob
    file: BINARY_DATA_HERE,
  } satisfies UserAvatarControllerUploadRequest;

  try {
    const data = await api.userAvatarControllerUpload(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **file** | `Blob` |  | [Defaults to `undefined`] |

### Return type

[**UploadAvatarResponseDto**](UploadAvatarResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## userPreferencesControllerGet

> UserPreferenceDto userPreferencesControllerGet()

Get user preferences

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { UserPreferencesControllerGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.userPreferencesControllerGet();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**UserPreferenceDto**](UserPreferenceDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## userPreferencesControllerUpdate

> UserPreferenceDto userPreferencesControllerUpdate(updateUserPreferenceDto)

Update user preferences

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { UserPreferencesControllerUpdateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // UpdateUserPreferenceDto
    updateUserPreferenceDto: ...,
  } satisfies UserPreferencesControllerUpdateRequest;

  try {
    const data = await api.userPreferencesControllerUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **updateUserPreferenceDto** | [UpdateUserPreferenceDto](UpdateUserPreferenceDto.md) |  | |

### Return type

[**UserPreferenceDto**](UserPreferenceDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

