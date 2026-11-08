// Opportunity rover solar energy during the June 2018 planet-encircling dust storm, as reported
// by the MER team (via The Planetary Society MER updates, archived in public/data/raw/opportunity-2018/).
// Sol dates: sol 5105 = 3 June 2018. Energy is watt-hours produced per sol by the solar arrays.
export const OPPORTUNITY_2018={
 source:'The Planetary Society MER Update, June 2018, quoting the MER operations team (NASA JPL)',
 survivalWh:90,
 points:[
  {sol:5103,date:'2018-06-01',wh:645},
  {sol:5105,date:'2018-06-03',wh:468},
  {sol:5106,date:'2018-06-04',wh:345,tau:2.1},
  {sol:5107,date:'2018-06-05',wh:133,tauNote:'estimated above 3.0'},
  {sol:5109,date:'2018-06-08',wh:22,tau:10.8}
 ]
};
/** Fraction of pre-storm sunlight (645 Wh = 1) reaching the panels, for t from 0 (calm) to 1 (storm peak). */
export function sunlightFraction(t){
 const p=OPPORTUNITY_2018.points,first=p[0].sol,span=p.at(-1).sol-first,sol=first+Math.max(0,Math.min(1,t))*span;
 for(let i=1;i<p.length;i++)if(sol<=p[i].sol){const a=p[i-1],b=p[i],u=(sol-a.sol)/(b.sol-a.sol);return (a.wh+(b.wh-a.wh)*u)/p[0].wh;}
 return p.at(-1).wh/p[0].wh;
}
