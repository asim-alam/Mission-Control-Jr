/** Keep every story event choice visible while condensing repetitive daily work. */
export function selectDecisionReview(history, recentWorkLimit=5){
 const events=history.filter(entry=>entry.type==='event');
 const work=history.filter(entry=>entry.type==='work');
 const recentWork=work.slice(-recentWorkLimit);
 return {
  entries:[...events,...recentWork].sort((a,b)=>a.sol-b.sol),
  summarizedWork:Math.max(0,work.length-recentWork.length)
 };
}
