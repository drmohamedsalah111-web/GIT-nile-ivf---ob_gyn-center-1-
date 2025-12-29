How to wire FINANCE_ROUTES into your app router

I could not find a root Angular router file in the workspace. Below are exact code snippets for the two common Angular routing setups. Pick the one that matches your app and add the snippet.

1) App uses RouterModule and an AppRoutingModule

- In your existing routing file (for example `src/app/app-routing.module.ts`):

```ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FINANCE_ROUTES } from './app/finance/finance.routes';

const routes: Routes = [
  // your existing routes
  ...FINANCE_ROUTES,
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

2) App uses standalone bootstrapApplication and provideRouter

- Edit your main bootstrap (e.g., `main.ts`) and merge the routes:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from './app/routes'; // or wherever your routes live
import { FINANCE_ROUTES } from './app/finance/finance.routes';

const routes = [
  ...APP_ROUTES,
  ...FINANCE_ROUTES,
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
  ],
});
```

3) Notes on DI wiring

- The finance service is `@Injectable({ providedIn: 'root' })` and all components use Angular DI (`inject(...)`).
- If your app uses a custom provider scope or different injector, ensure you add `SupabaseFinanceService` to the root injector or appropriate provider list.

4) After wiring routes

- Add a link to `/finance` and `/doctor/finance` in your navigation.
- Ensure env variables are available for the service: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

If you point me to your router file I can add the imports and route spread directly into it. Otherwise I can create a small patch that applies the snippet to a target file you name.