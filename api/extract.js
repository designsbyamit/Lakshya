const { Buffer } = require('buffer');

function cleanText(value) {
  return String(value || '').replace(/\u0000/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
function lines(text) { return cleanText(text).split(/\n+/).map(s => s.trim()).filter(Boolean); }
function uuid() { return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
const SKILLS=['User research','UX research','Interaction design','Visual design','Information architecture','Prototyping','Design systems','Service design','Content design','Accessibility','Motion design','Data visualisation','Product strategy','Design thinking','Facilitation','Storytelling','Stakeholder management','Leadership','Mentoring','Communication','Systems thinking','Project management','AI / ML','Generative AI','HTML / CSS','JavaScript','Figma','Sketch','Adobe Creative Suite','Usability testing'];
const SECTION_NAMES={
 experience:/^(experience|work experience|professional experience|employment|career|work history|professional history|employment history|career history|roles?|work)$/i,
 education:/^(education|academic background|qualifications|academic qualifications)$/i,
 skills:/^(skills|core skills|expertise|competencies|tools|technical skills|technologies|skills & expertise)$/i,
 projects:/^(projects|selected projects|selected work|case studies|portfolio|key projects|notable projects)$/i,
 certifications:/^(certifications|certificates|training|courses)$/i,
 awards:/^(awards|recognition|achievements|honours|honors)$/i,
 publications:/^(publications|speaking|talks|presentations)$/i
};
function classifySection(s){
 const t=s.trim().replace(/^[•*#\s]+|[:|]+$/g,'').trim();
 for(const [k,re] of Object.entries(SECTION_NAMES)) if(re.test(t)) return k;
 const l=t.toLowerCase();
 if(/^(professional|work|career)\s+(experience|history)$/.test(l)) return 'experience';
 if(/^(selected|key|notable)\s+(projects?|work|case studies)$/.test(l)) return 'projects';
 if(/^(technical|design|core)\s+(skills?|expertise)$/.test(l)) return 'skills';
 return null;
}
function parseDateToken(x){
 const t=String(x||'').trim();
 if(/^(present|current|now)$/i.test(t)) return t;
 if(/^\d{1,2}[\/.-]\d{4}$/.test(t)){const [m,y]=t.split(/[\/.-]/);return y+'-'+String(m).padStart(2,'0');}
 if(/^20\d{2}$/.test(t)) return t;
 return t;
}
function parseDatePair(text){
 const t=String(text||'').replace(/\s+/g,' ').trim();
 const months='Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
 const re=new RegExp('((?:'+months+')?\\s*20\\d{2}|\\d{1,2}[\\/.\\-]20\\d{2})\\s*(?:-|–|—|to|through|\\|)\\s*((?:Present|Current|Now)|(?:'+months+')?\\s*20\\d{2}|\\d{1,2}[\\/.\\-]20\\d{2})','i');
 const m=t.match(re);
 return m?{startDate:parseDateToken(m[1]),endDate:parseDateToken(m[2])}:null;
}
function looksLikeDate(line){return parseDatePair(line)||/^\s*(?:Present|Current|Now)\s*$/i.test(line)||/^\s*20\d{2}\s*$/.test(line);}
function extractSections(text){
 const ls=lines(text),sections={header:[],experience:[],education:[],skills:[],projects:[],certifications:[],awards:[],publications:[],other:[]};
 let current='header';
 for(const line of ls){
   const section=classifySection(line);
   if(section){current=section;continue;}
   sections[current].push(line);
 }
 return sections;
}
function extractContact(header){const joined=header.join(' '),email=(joined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[])[0]||'',urls=[...joined.matchAll(/https?:\/\/[^\s,)]+/gi)].map(m=>m[0].replace(/[.)]+$/,'')),phone=(joined.match(/(?:\+?\d[\d\s().-]{7,}\d)/)||[])[0]||'',name=header.find(x=>!/@/.test(x)&&!/https?:\/\//i.test(x)&&!looksLikeDate(x)&&!/^(?:\+?\d[\d\s().-]+)$/.test(x)&&x.length<70)||'';return{name,email,phone,urls};}
function extractExperience(section){
 const out=[];
 const isCompany=x=>x&&x.length<=120&&!/[.!?]$/.test(x)&&/\b(inc|ltd|llc|corp|corporation|company|technolog|software|systems?|solutions?|consult|studio|agency|group|labs?|sap|ibm|microsoft|google|adobe|accenture|deloitte|tcs|infosys|wipro|capgemini)\b/i.test(x);
 const cleanRole=x=>String(x||'').replace(/^[•*\-]+\s*/,'').replace(/\s+/g,' ').trim();
 for(let i=0;i<section.length;i++){
   let date=parseDatePair(section[i]);
   let dateLine=section[i];
   if(!date && i+1<section.length) { date=parseDatePair(section[i]+' '+section[i+1]); if(date) dateLine=section[i]+' '+section[i+1]; }
   if(!date) continue;
   const before=cleanRole(section[i].replace(date.startDate,'').replace(date.endDate,'').replace(/[-–—|•]/g,' '));
   const nearby=section.slice(Math.max(0,i-4),Math.min(section.length,i+5)).filter(x=>x!==dateLine&&!looksLikeDate(x));
   const candidates=[before,...nearby].map(cleanRole).filter(x=>x&&x.length>=2&&x.length<=140);
   const role=candidates.find(x=>!isCompany(x)&&!/^(responsibilities|achievements|selected work)$/i.test(x))||candidates[0]||'Role';
   const companyCandidates=nearby.map(cleanRole).filter(x=>x!==role&&x.length<=120);
   const company=companyCandidates.find(isCompany)||companyCandidates[0]||'';
   const desc=[];
   for(let j=i+1;j<Math.min(section.length,i+14);j++){
     if(j!==i+1&&parseDatePair(section[j])) break;
     if(section[j]===dateLine) continue;
     if(section[j].length>35) desc.push(section[j]);
   }
   out.push({id:uuid(),role:role.slice(0,120),company:company===role?'':company.slice(0,120),...date,description:desc.slice(0,8).join(' '),responsibilities:desc.slice(0,8),achievements:desc.filter(x=>/\b(led|launched|delivered|increased|reduced|saved|grew|built|created)\b/i.test(x)).slice(0,5),confirmed:false,source:'resume'});
 }
 const seen=new Set();
 return out.filter(x=>{const k=[x.role,x.company,x.startDate,x.endDate].join('|').toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
}
function extractSkills(sections,text){const found=new Set(),skillText=[...sections.skills,...sections.header].join(' ').toLowerCase();for(const skill of SKILLS){const aliases=[skill.toLowerCase()];if(skill==='Generative AI')aliases.push('gen ai','generative artificial intelligence');if(skill==='AI / ML')aliases.push('artificial intelligence','machine learning');if(skill==='Visual design')aliases.push('visual ui','ui design');if(skill==='Interaction design')aliases.push('interaction');if(skill==='User research')aliases.push('ux research');if(skill==='Design systems')aliases.push('design system');if(aliases.some(a=>skillText.includes(a)))found.add(skill);}const all=text.toLowerCase();for(const skill of SKILLS){const aliases=[skill.toLowerCase()];if(skill==='Generative AI')aliases.push('gen ai');if(skill==='AI / ML')aliases.push('artificial intelligence','machine learning');const hits=aliases.reduce((n,a)=>n+(all.match(new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'))||[]).length,0);if(hits>=2)found.add(skill);}return[...found];}
function extractEducation(section){return section.filter(x=>/(university|college|institute|school|academy|bachelor|master|b\.tech|m\.tech|mba|mfa|bfa|phd|degree|diploma)/i.test(x)).slice(0,12).map(line=>({institution:line,degree:'',year:(line.match(/\b20\d{2}\b/)||[])[0]||''}));}
function buildProjects(sections,timeline){
 const escRe=x=>String(x||'').replace(/[.*+?^{}()|[\]\\]/g,'\\$&');
 const make=(chunk,related,i,source)=>{
   const clean=String(chunk).replace(/^[-•*]+\s*/,'').replace(/\s+/g,' ').trim();
   const explicit=(clean.match(/(?:project|product|platform|initiative|program|redesign|case study|experience)[:\s-]+([^.;]{4,100})/i)||[])[1];
   const name=(explicit||clean.split(/[.!?]/)[0]).trim().slice(0,110);
   const skills=SKILLS.filter(s=>new RegExp(escRe(s),'i').test(clean));
   return{id:uuid(),name,company:related?.company||'',role:related?.role||'',startDate:related?.startDate||'',endDate:related?.endDate||'',client:'',industry:'',platform:'',deviceType:'',businessModel:'',audience:'',summary:clean.slice(0,900),expectation:'',process:[],outcome:'',impact:'',skills,tools:[],methods:[],evidence:[clean],source};
 };
 if(sections.projects?.length) return sections.projects.filter(x=>x.length>25).slice(0,80).map((x,i)=>make(x,timeline.find(t=>t.company&&x.toLowerCase().includes(t.company.toLowerCase())),i,'resume-project'));
 return timeline.flatMap(t=>(t.responsibilities||[]).slice(0,12).map((x,i)=>make(x,t,i,'role-evidence')));
}
function deterministic(text,filename){const sections=extractSections(text),contact=extractContact(sections.header),timeline=extractExperience(sections.experience),skills=extractSkills(sections,text),education=extractEducation(sections.education),projects=buildProjects(sections,timeline);return{schemaVersion:'lakshya.career.v2',source:{filename,processedAt:new Date().toISOString(),parser:'wing-span-inspired server parser',characterCount:text.length},person:contact,rawText:text,sections,timeline,projects,skills,education,certifications:sections.certifications,awards:sections.awards,publications:sections.publications,signals:{careerStageSignals:timeline.map(t=>t.role).filter(Boolean),geographySignals:[],evidenceQuality:text.length>12000?'rich':text.length>5000?'moderate':'sparse'}};}
async function parseBuffer(buffer,filename){const ext=(filename.split('.').pop()||'').toLowerCase();if(ext==='txt'||ext==='md'||ext==='csv')return buffer.toString('utf8');if(ext==='docx'){const mammoth=require('mammoth');return(await mammoth.extractRawText({buffer})).value;}if(ext==='xlsx'||ext==='xls'){const XLSX=require('xlsx'),wb=XLSX.read(buffer,{type:'buffer'});return wb.SheetNames.map(n=>'--- Sheet: '+n+' ---\n'+XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n');}if(ext==='pdf'){const{extractText}=await import('unpdf');const result=await extractText(new Uint8Array(buffer),{mergePages:true});return Array.isArray(result.text)?result.text.join('\n'):result.text||'';}throw new Error('Unsupported file type: '+ext);}
module.exports=async function handler(req,res){if(req.method!=='POST')return res.status(405).json({error:'POST only'});try{const{filename,base64,rawText}=req.body||{};if(!filename&&!rawText)return res.status(400).json({error:'No document supplied'});const text=rawText||await parseBuffer(Buffer.from(base64,'base64'),filename);if(cleanText(text).length<80)return res.status(422).json({error:'The document was read, but there is not enough text to analyse. This usually means the PDF is scanned/image-only.'});const db=deterministic(text,filename||'pasted-text');return res.status(200).json(db);}catch(e){console.error('Lakshya extraction error',e);return res.status(500).json({error:e?.message||'Extraction failed'});}};
