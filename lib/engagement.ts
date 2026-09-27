// Pure policies shared by camera invitations and the mascot, independent of rendering.
export function createArrivalGate(cooldown = 60000, settle = 900, absence = 6000) {
  let firstSeen: number | null = null, lastSeen: number | null = null, invited = false, lastInvite = -Infinity;
  return {
    observe(present: boolean, now: number) {
      if (present) { if(firstSeen===null) firstSeen=now; lastSeen=now; }
      else if(lastSeen!==null && now-lastSeen>=absence) { firstSeen=null; lastSeen=null; invited=false; }
      return present && firstSeen!==null && now-firstSeen>=settle && !invited && now-lastInvite>=cooldown;
    },
    invited(now: number) { invited=true; lastInvite=now;lastSeen??=now; },
    resetArrival() { firstSeen=null; lastSeen=null; invited=false; },
  };
}

export function createShuffleBag<T>(random: () => number = Math.random) {
  let last: T | undefined;
  let bag: T[]=[];
  let signature: readonly T[]=[];
  return (items: readonly T[]): T => {
    if (!items.length) throw Error('An interaction pool must not be empty');
    if (!bag.length || items.length!==signature.length || items.some((item,i)=>item!==signature[i])) {
      signature=[...items];bag=[...items];
      for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
      if(bag.length>1&&bag[bag.length-1]===last)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];
    }
    last=bag.pop()!; return last;
  };
}
