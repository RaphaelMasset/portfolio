import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { ProjectPage } from './pages/project/project';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'project/:slug', component: ProjectPage },
  { path: '**', redirectTo: '' }
];
