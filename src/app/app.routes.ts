import { Routes } from '@angular/router';
import { PagesComponent } from './pages/pages.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import ElectionComponent from './pages/election/election.component';
import { ResultComponent } from './pages/result/result.component';
import { UserComponent } from './user/user.component';
import { VoteComponent } from './pages/vote/vote.component';
import { RouterModule } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  {
    path: 'app',
    component: PagesComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent, title: 'Dashboard · SE BlockVote' },
      { path: 'election', component: ElectionComponent, title: 'Election · SE BlockVote' },
      { path: 'result', component: ResultComponent, title: 'Results · SE BlockVote' },
    ],
  },
  {
    path: 'user',
    component: UserComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent, title: 'Voter Dashboard · SE BlockVote' },
      { path: 'vote', component: VoteComponent, title: 'Vote · SE BlockVote' },
      { path: 'vote/:electionId', component: VoteComponent, title: 'Vote · SE BlockVote' },
      { path: 'result', component: ResultComponent, title: 'Election Results · SE BlockVote' },
      { path: 'result/:electionId', component: ResultComponent, title: 'Election Results · SE BlockVote' },
    ],
  },
  { path: '**', redirectTo: 'app' },
];
