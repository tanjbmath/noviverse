// Keep 44px discovery targets separate when compressed orbits project close together.
export function placeNode(point,placed,width,height){
  const valid=p=>p.x>=25&&p.x<=width-25&&p.y>=88&&p.y<=height-105&&placed.every(other=>Math.hypot(p.x-other.x,p.y-other.y)>=46);
  if(valid(point))return point;
  for(const radius of [46,64,84])for(let i=0;i<12;i++){
    const angle=i/12*Math.PI*2,candidate={x:point.x+Math.cos(angle)*radius,y:point.y+Math.sin(angle)*radius};
    if(valid(candidate))return candidate;
  }
  return null; // The accessible Explore list always remains available.
}
