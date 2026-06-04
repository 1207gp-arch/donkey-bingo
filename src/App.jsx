import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { ref, onValue, set } from "firebase/database";

const DEFAULT_MISSIONS = [
  { name: "큐티 인증",              talent: 10   },
  { name: "히든미션",               talent: null },
  { name: "금요예배",               talent: 15   },
  { name: "주일예배",               talent: 20   },
  { name: "가위바위보\n지혜목자",    talent: 5    },
  { name: "히든미션",               talent: null },
  { name: "가위바위보\n명철목자",    talent: 5    },
  { name: "목장\n단체사진 인증",     talent: 20   },
  { name: "동아리참석",             talent: 10   },
  { name: "큐티 인증",              talent: 10   },
  { name: "전도",                   talent: 100  },
  { name: "참청 인스타\n유튜브구독", talent: 10   },
  { name: "🫏당나귀\n참석",         talent: 50   },
  { name: "가위바위보\n혜빈목자",    talent: 5    },
  { name: "히든미션",               talent: null },
  { name: "청년부\n예배참석",        talent: 5    },
  { name: "주일예배",               talent: 20   },
  { name: "큐티 인증",              talent: 10   },
  { name: "히든미션",               talent: null },
  { name: "동아리참석",             talent: 10   },
  { name: "말씀암송",               talent: 20   },
  { name: "동아리참석",             talent: 10   },
  { name: "가위바위보\n유정목자",    talent: 5    },
  { name: "청년부\n예배참석",        talent: 5    },
  { name: "금요예배",               talent: 15   },
];

const MISSION_DESC = {
  "큐티 인증":              "하단 [큐티 인증] 항목을 클릭하면 매일매일 말씀이 올라와요 😊 말씀을 묵상하고 느낀 점을 댓글에 남겨주시면 인증 완료!",
  "히든미션":               "히든미션은 당나귀 당일에 공개돼요! 두근두근 기대해주세요 🎉",
  "금요예배":               "금요일 오후 8시, 대예배실(청년부 예배드리는 곳)에서 예배를 드린 뒤 인증샷을 찍어주세요 📸 주일에 목자에게 사진을 보여주시면 인증 완료!",
  "주일예배":               "오후 2시 대예배실에서 청년부 예배에 참석하시면 미션 완료! 예배 후 계단에 서있는 새가족 목자를 찾아오시면 돼요 😊",
  "가위바위보\n지혜목자":   "주일 본당 큰 계단으로 올라오시면 새가족 목자를 만날 수 있어요 😄 기회는 단 한 번! 가위바위보에서 이기시면 됩니다!",
  "가위바위보\n명철목자":   "주일 본당 큰 계단으로 올라오시면 새가족 목자를 만날 수 있어요 😄 기회는 단 한 번! 가위바위보에서 이기시면 됩니다!",
  "목장\n단체사진 인증":    "등반하신 분은 등반한 목장, 아직 새가족 교육을 받고 계신 분들은 새가족 목장 전체와 함께 인증사진을 찍어주시면 됩니다 📸 목자에게 사진을 보여주시면 인증 완료!",
  "동아리참석":             "러닝 동아리(소닉), 봉사 동아리(러빙유), 배드민턴 동아리(비트), 축구 동아리(참청FC)가 있어요 🏃 동아리 일정은 어플 하단에 따로 적어둘게요! 마음에 드는 동아리에 참석하시면 됩니다 😊",
  "전도":                   "친구를 청년부 예배에 데리고 오시면 돼요 🙌 소중한 사람과 함께 예배드려요!",
  "참청 인스타\n유튜브구독":"하단에 참청 인스타와 참청 유튜브 링크가 있어요 💚 팔로우&구독 해주시면 인증 완료!",
  "🫏당나귀\n참석":        "2026.06.21(일) 오후 3:30에 참석하시면 달란트 50개를 드려요! 꼭 함께해요 🫏✨",
  "가위바위보\n혜빈목자":   "주일 본당 큰 계단으로 올라오시면 새가족 목자를 만날 수 있어요 😄 기회는 단 한 번! 가위바위보에서 이기시면 됩니다!",
  "청년부\n예배참석":       "주일 오전 예배에 참석해주세요 🙏 예배 후 목자에게 알려주시면 인증 완료!",
  "말씀암송":               "어플 상단에 있는 골로새서 3:15 말씀을 보지 않고 목자 앞에서 말씀하실 수 있으면 됩니다 📖 할 수 있어요!",
  "가위바위보\n유정목자":   "주일 본당 큰 계단으로 올라오시면 새가족 목자를 만날 수 있어요 😄 기회는 단 한 번! 가위바위보에서 이기시면 됩니다!",
};

const VERSE = { ref: "골로새서 3:15", text: "그리스도의 평강이 너희 마음을 주장하게 하라 너희는 평강을 위하여 한 몸으로 부르심을 받았나니" };
const ADMIN_PASSWORD = "1235";

function safeName(name) {
  return name.replace(/[.#$[\]/]/g, "_");
}
async function fbSet(path, val) {
  try { await set(ref(db, path), val); } catch(e) { console.error(e); }
}

function checkBingo(checked) {
  let count = 0;
  for (let r = 0; r < 5; r++) if ([0,1,2,3,4].every(c => checked[r*5+c])) count++;
  for (let c = 0; c < 5; c++) if ([0,1,2,3,4].every(r => checked[r*5+c])) count++;
  if ([0,6,12,18,24].every(i => checked[i])) count++;
  if ([4,8,12,16,20].every(i => checked[i])) count++;
  return count;
}
function getBingoBonus(n) {
  return [0,10,30,60,100,150,210,280,360,450,550,660,780][Math.min(n,12)];
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState("home");
  const [members, setMembersState] = useState([]);
  const [missions, setMissionsState] = useState(DEFAULT_MISSIONS);
  const [qtPosts, setQtPostsState] = useState([]);
  const [currentMember, setCurrentMember] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubM = onValue(ref(db, "members"), snap => {
      const val = snap.val();
      if (val) setMembersState(Object.values(val));
      setReady(true);
    });
    const unsubMs = onValue(ref(db, "missions"), snap => {
      const val = snap.val();
      if (val && Array.isArray(val) && typeof val[0]==="object") setMissionsState(val);
    });
    const unsubQt = onValue(ref(db, "qtPosts"), snap => {
      const val = snap.val();
      if (val) setQtPostsState(Object.values(val).sort((a,b) => b.id-a.id));
      else setQtPostsState([]);
    });
    const timer = setTimeout(() => setReady(true), 3000);
    return () => { clearTimeout(timer); };
  }, []);

  const updateMember = (name, fn) => {
    setMembersState(prev => {
      const member = prev.find(m => m.name===name);
      if (!member) return prev;
      const updated = fn(member);
      fbSet("members/" + safeName(name), updated);
      return prev.map(m => m.name===name ? updated : m);
    });
  };
  const setMembers = (fnOrVal) => {
    setMembersState(prev => {
      const next = typeof fnOrVal==="function" ? fnOrVal(prev) : fnOrVal;
      next.forEach(m => fbSet("members/" + safeName(m.name), m));
      prev.forEach(m => { if (!next.find(nm => nm.name===m.name)) set(ref(db,"members/"+safeName(m.name)), null); });
      return next;
    });
  };
  const setMissions = (val) => {
    setMissionsState(prev => { const next = typeof val==="function" ? val(prev) : val; fbSet("missions", next); return next; });
  };
  const setQtPosts = (fnOrVal) => {
    setQtPostsState(prev => {
      const next = typeof fnOrVal==="function" ? fnOrVal(prev) : fnOrVal;
      const obj = {};
      next.forEach(p => { obj[p.id] = p; });
      prev.forEach(p => { if (!next.find(np => np.id===p.id)) obj[p.id] = null; });
      set(ref(db, "qtPosts"), Object.keys(obj).length ? obj : null);
      return next;
    });
  };

  const getMember = name => members.find(m => m.name===name);
  const nav = (p, mem) => { if (mem) setCurrentMember(mem); setPage(p); };

  if (!ready) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f0e8", fontFamily:"'Apple SD Gothic Neo',sans-serif" }}>
      <div style={{ textAlign:"center", color:"#4a7c59" }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🫏</div>
        <p style={{ fontWeight:700, fontSize:16 }}>불러오는 중...</p>
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <div style={S.container}>
        {page==="home"  && <HomePage members={members} setMembers={setMembers} nav={nav} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />}
        {page==="bingo" && currentMember && <BingoPage member={getMember(currentMember)} missions={missions} updateMember={updateMember} nav={nav} qtPosts={qtPosts} />}
        {page==="verse" && currentMember && <VersePage member={getMember(currentMember)} updateMember={updateMember} nav={nav} />}
        {page==="qt"    && currentMember && <QtBoardPage member={getMember(currentMember)} qtPosts={qtPosts} setQtPosts={setQtPosts} isAdmin={isAdmin} nav={nav} />}
        {page==="club"   && currentMember && <ClubPage nav={nav} />}
        {page==="admin" && isAdmin        && <AdminPage members={members} setMembers={setMembers} missions={missions} setMissions={setMissions} qtPosts={qtPosts} setQtPosts={setQtPosts} nav={nav} />}
      </div>
    </div>
  );
}

function HomePage({ members, setMembers, nav, isAdmin, setIsAdmin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [adminPw, setAdminPw] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [error, setError] = useState("");

  const login = () => {
    const n = name.trim();
    if (!n||!pw) { setError("이름과 비밀번호를 입력하세요"); return; }
    const m = members.find(x => x.name===n);
    if (!m) { setError("등록되지 않은 이름이에요. 처음 등록하기를 눌러주세요"); return; }
    if (m.password!==pw) { setError("비밀번호가 틀렸습니다"); return; }
    nav("bingo", n);
  };
  const register = () => {
    const n = name.trim();
    if (!n||!pw) { setError("이름과 비밀번호를 입력하세요"); return; }
    if (pw!==pw2) { setError("비밀번호가 일치하지 않아요"); return; }
    if (members.find(x => x.name===n)) { setError("이미 등록된 이름이에요. 로그인해주세요"); return; }
    const newMember = { name:n, password:pw, checked:Array(25).fill(false), checkedTalent:Array(25).fill(0), attendance:[], verses:[], qtList:[], talent:0, rsvp:null };
    fbSet("members/" + safeName(n), newMember);
    nav("bingo", n);
  };
  const loginAdmin = () => {
    if (adminPw===ADMIN_PASSWORD) { setIsAdmin(true); nav("admin"); }
    else setError("비밀번호가 틀렸습니다");
  };
  const switchMode = m => { setMode(m); setError(""); setPw(""); setPw2(""); };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={{ fontSize:40, color:"#4a7c59", marginBottom:8 }}>✝</div>
        <h1 style={S.title}>당나귀 🫏</h1>
        <p style={S.subtitle}>2026 상반기 새가족팀</p>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        <button style={{ ...S.tab, flex:1, ...(mode==="login"?S.tabActive:{}) }} onClick={() => switchMode("login")}>로그인</button>
        <button style={{ ...S.tab, flex:1, ...(mode==="register"?S.tabActive:{}) }} onClick={() => switchMode("register")}>처음 등록하기</button>
      </div>
      <div style={S.card}>
        <p style={S.label}>이름</p>
        <input style={S.input} placeholder="홍길동" value={name} onChange={e => { setName(e.target.value); setError(""); }} />
        <p style={S.label}>비밀번호</p>
        <input style={S.input} type="password" placeholder="비밀번호" value={pw} onChange={e => { setPw(e.target.value); setError(""); }} onKeyDown={e => e.key==="Enter"&&mode==="login"&&login()} />
        {mode==="register" && (<>
          <p style={S.label}>비밀번호 확인</p>
          <input style={S.input} type="password" placeholder="비밀번호 재입력" value={pw2} onChange={e => { setPw2(e.target.value); setError(""); }} onKeyDown={e => e.key==="Enter"&&register()} />
        </>)}
        {error && <p style={{ color:"#e74c3c", fontSize:13, marginBottom:10 }}>{error}</p>}
        <button style={S.btnPrimary} onClick={mode==="login"?login:register}>
          {mode==="login"?"입장하기":"등록하고 입장하기"}
        </button>
      </div>
      <div style={{ textAlign:"center", marginTop:16 }}>
        {!showAdmin ? (
          <button style={S.btnGhost} onClick={() => setShowAdmin(true)}>관리자 메뉴</button>
        ) : (
          <div style={S.card}>
            <input style={S.input} type="password" placeholder="관리자 비밀번호" value={adminPw} onChange={e => setAdminPw(e.target.value)} onKeyDown={e => e.key==="Enter"&&loginAdmin()} />
            <button style={S.btnPrimary} onClick={loginAdmin}>로그인</button>
          </div>
        )}
      </div>
    </div>
  );
}

function BingoPage({ member, missions, updateMember, nav, qtPosts }) {
  const [pendingIdx, setPendingIdx] = useState(null);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [descIdx, setDescIdx] = useState(null);
  const [hiddenTalent, setHiddenTalent] = useState("");
  const bingoCount = checkBingo(member.checked);

  const handleCell = i => {
    if (member.checked[i]) applyToggle(i, true);
    else { setPendingIdx(i); setPwInput(""); setPwError(""); setHiddenTalent(""); }
  };
  const confirmPw = () => {
    if (pwInput===ADMIN_PASSWORD) {
      const override = missions[pendingIdx].talent===null&&hiddenTalent!==""?Number(hiddenTalent):undefined;
      applyToggle(pendingIdx, false, override); setPendingIdx(null);
    } else setPwError("비밀번호가 틀렸습니다");
  };
  const applyToggle = (i, wasChecked, overrideTalent) => {
    const newChecked = [...member.checked]; newChecked[i] = !wasChecked;
    const newCT = [...(member.checkedTalent||Array(25).fill(0))];
    let missionDelta = 0;
    if (wasChecked) { missionDelta = -(newCT[i]||0); newCT[i] = 0; }
    else { const t = overrideTalent!==undefined?overrideTalent:(missions[i].talent||0); missionDelta=t; newCT[i]=t; }
    const bonusDelta = getBingoBonus(checkBingo(newChecked)) - getBingoBonus(checkBingo(member.checked));
    updateMember(member.name, m => ({ ...m, checked:newChecked, checkedTalent:newCT, talent:Math.max(0,m.talent+missionDelta+bonusDelta), ...(i===12?{donkeyChecked:!wasChecked}:{}) }));
  };

  const latestPost = qtPosts&&qtPosts[0];
  const showQtAlert = latestPost&&!(latestPost.comments||[]).some(c => c.author===member.name);

  return (
    <div style={S.page}>
      {descIdx!==null && (
        <div style={S.overlay} onClick={() => setDescIdx(null)}>
          <div style={{ ...S.modal, textAlign:"center" }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize:22, marginBottom:8 }}>📋</p>
            <p style={{ fontWeight:700, fontSize:16, marginBottom:12, color:"#1a3a2a" }}>{missions[descIdx].name.replace("\n"," ")}</p>
            <p style={{ fontSize:14, color:"#555", lineHeight:1.8, marginBottom:20 }}>{MISSION_DESC[missions[descIdx].name]||"설명이 곧 업데이트될 예정이에요 😊"}</p>
            <button style={S.btnPrimary} onClick={() => setDescIdx(null)}>확인</button>
          </div>
        </div>
      )}
      {pendingIdx!==null && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <p style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>미션 인증</p>
            <p style={{ fontSize:13, color:"#666", marginBottom:14 }}><b>{missions[pendingIdx].name.replace("\n"," ")}</b><br/>관리자 비밀번호를 입력하세요</p>
            <input style={S.input} type="password" placeholder="비밀번호" value={pwInput} autoFocus onChange={e => { setPwInput(e.target.value); setPwError(""); }} onKeyDown={e => e.key==="Enter"&&confirmPw()} />
            {missions[pendingIdx].talent===null && (
              <input style={{ ...S.input, marginTop:4 }} type="number" placeholder="달란트 입력 (예: 30)" value={hiddenTalent} onChange={e => setHiddenTalent(e.target.value)} />
            )}
            {pwError && <p style={{ color:"#e74c3c", fontSize:13 }}>{pwError}</p>}
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <button style={{ ...S.btnPrimary, flex:1 }} onClick={confirmPw}>확인</button>
              <button style={{ ...S.btnGhost, flex:1 }} onClick={() => setPendingIdx(null)}>취소</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.topBar}>
        <button style={S.back} onClick={() => nav("home")}>← 홈</button>
        <span style={S.topName}>{member.name}</span>
        <span style={S.talentBadge}>🎫 {member.talent}</span>
      </div>

      <div style={{ background:"linear-gradient(135deg,#e8f4ec,#f0f7f2)", border:"1.5px solid #c8dfd0", borderRadius:14, padding:"14px 16px", marginBottom:12, textAlign:"center" }}>
        <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, color:"#4a7c59", letterSpacing:0.5 }}>📖 말씀 암송</p>
        <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:700, color:"#1a3a2a" }}>골로새서 3:15</p>
        <p style={{ margin:0, fontSize:12, color:"#3a5a45", lineHeight:1.8 }}>그리스도의 평강이 너희 마음을 주장하게 하라<br/>너희는 평강을 위하여 한 몸으로 부르심을 받았나니</p>
      </div>

      {showQtAlert && (
        <button style={{ width:"100%", marginBottom:12, padding:"12px 16px", background:"#fff8e1", border:"1.5px solid #f9a825", borderRadius:12, cursor:"pointer", display:"flex", alignItems:"center", gap:10, textAlign:"left" }} onClick={() => nav("qt")}>
          <span style={{ fontSize:22 }}>📖</span>
          <div>
            <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#5d4037" }}>새 말씀이 올라왔어요!</p>
            <p style={{ margin:"2px 0 0", fontSize:12, color:"#795548" }}>아직 댓글을 달지 않았어요 → 큐티 인증하러 가기</p>
          </div>
          <span style={{ marginLeft:"auto", fontSize:18 }}>→</span>
        </button>
      )}

      <div style={S.statsRow}>
        <div style={S.stat}><b>{bingoCount}줄</b><span>빙고</span></div>
        <div style={{ ...S.stat, minWidth:160 }}><b style={{ fontSize:20 }}>🎫 {member.talent}</b><span>내 달란트</span></div>
      </div>

      <div style={{ background:"#fafaf8", border:"1px solid #eee", borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
        <b style={{ color:"#1a3a2a", fontSize:13, display:"block", marginBottom:6 }}>🎯 빙고 달란트 보너스 (가로·세로·대각선)</b>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4, textAlign:"center" }}>
          {[1,2,3,4,5].map(n => (
            <div key={n} style={{ background:bingoCount>=n?"#d4edda":"#f0f0ec", borderRadius:8, padding:"4px 2px", border:bingoCount>=n?"1.5px solid #4a7c59":"1.5px solid #ddd" }}>
              <div style={{ fontWeight:700, fontSize:12, color:bingoCount>=n?"#2e7d32":"#aaa" }}>{n}줄</div>
              <div style={{ color:bingoCount>=n?"#2e7d32":"#999", fontSize:11 }}>🎫{[10,30,60,100,150][n-1]}</div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize:12, color:"#888", textAlign:"right", marginBottom:6 }}>ⓘ 를 누르면 미션 방법을 확인할 수 있어요</p>
      <div style={S.bingoGrid}>
        {missions.map((m,i) => {
          const done = member.checked[i];
          return (
            <button key={i} style={{ ...S.bingoCell, ...(done?S.bingoCellDone:{}) }} onClick={() => handleCell(i)}>
              {done && <span style={S.checkMark}>✓</span>}
              <button style={{ position:"absolute", top:2, left:3, background:"none", border:"none", fontSize:9, color:"#aaa", cursor:"pointer", padding:0, lineHeight:1, zIndex:2 }}
                onClick={e => { e.stopPropagation(); setDescIdx(i); }}>ⓘ</button>
              <span style={S.cellName}>{m.name}</span>
              <span style={{ ...S.cellTalent, ...(m.talent===null?S.cellTalentHidden:{}) }}>{m.talent!==null?"🎫"+m.talent:"🎫?"}</span>
            </button>
          );
        })}
      </div>

      <div style={{ background:"#fff8e1", border:"1.5px solid #f9a825", borderRadius:14, padding:"14px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:28 }}>🫏</span>
        <div>
          <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#5d4037" }}>당나귀 참석 일정</p>
          <p style={{ margin:"3px 0 0", fontSize:13, color:"#795548" }}>2026.06.21(일) 오후 3:30</p>
          <p style={{ margin:"2px 0 0", fontSize:12, color:"#a1887f" }}>장소 : 추후 안내</p>
          <p style={{ margin:"2px 0 0", fontSize:12, color:"#a1887f" }}>예배 후 바로 · 참석 시 🎫50개</p>
        </div>
      </div>

      <div style={{ background:"#fff", border:"1.5px solid #e0e0e0", borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
        <p style={{ margin:"0 0 10px", fontWeight:700, fontSize:14, color:"#1a3a2a" }}>✅ 당나귀 참석 여부 확인 <span style={{ color:"#e53935", fontSize:12 }}>(필수)</span></p>
        <div style={{ display:"flex", gap:8 }}>
          {[["참석 가능","#e8f4ec","#2e7d32","#4a7c59"],["미정","#fff8e1","#f57f17","#f9a825"],["참석 불가","#fdecea","#c62828","#e53935"]].map(([label,bg,color,border]) => (
            <button key={label} style={{ flex:1, padding:"10px 4px", borderRadius:10, border:member.rsvp===label?"2px solid "+border:"1.5px solid #ddd", background:member.rsvp===label?bg:"#fafaf8", color:member.rsvp===label?color:"#aaa", fontWeight:700, fontSize:13, cursor:"pointer" }}
              onClick={() => updateMember(member.name, m => ({ ...m, rsvp:m.rsvp===label?null:label }))}>
              {label}
            </button>
          ))}
        </div>
        {member.rsvp && <p style={{ margin:"8px 0 0", fontSize:12, color:"#888", textAlign:"center" }}>'{member.rsvp}'(으)로 응답했어요 😊 언제든지 변경할 수 있어요!</p>}
      </div>

      <button style={{ width:"100%", marginBottom:10, padding:"13px", background:"#f0f7f2", color:"#2e5f3f", border:"1.5px solid #4a7c59", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer" }} onClick={() => nav("club")}>🏃 동아리 소개</button>

      <button style={{ width:"100%", marginBottom:10, padding:"13px", background:"#e8f4ec", color:"#2e5f3f", border:"1.5px solid #4a7c59", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer" }} onClick={() => nav("qt")}>📖 큐티 인증</button>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <a href="https://www.instagram.com/jooan_charm?igsh=dHNnN2d3NjgwZW1o" target="_blank" rel="noreferrer"
          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"12px", borderRadius:12, textDecoration:"none", fontWeight:700, fontSize:14, background:"linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", color:"#fff" }}>
          📸 참청 인스타
        </a>
        <a href="https://youtube.com/@charmchung?si=es02SSB0rzBlzZPK" target="_blank" rel="noreferrer"
          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"12px", borderRadius:12, textDecoration:"none", fontWeight:700, fontSize:14, background:"#FF0000", color:"#fff" }}>
          ▶️ 참청 유튜브
        </a>
      </div>

      {bingoCount>0 && <div style={S.bingoBanner}>🎉 {bingoCount}빙고 달성! 달란트 {member.talent}개</div>}
    </div>
  );
}

function VersePage({ member, updateMember, nav }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const done = member.verses?.includes(VERSE.ref);
  const check = () => {
    if (!input.trim()) return;
    const correct = input.replace(/\s/g,"")===VERSE.text.replace(/\s/g,"");
    if (correct&&!done) updateMember(member.name, m => ({ ...m, verses:[...(m.verses||[]),VERSE.ref], talent:m.talent+20 }));
    setResult({ correct, already:done });
  };
  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <button style={S.back} onClick={() => nav("bingo")}>← 빙고</button>
        <span style={S.topName}>말씀 암송</span>
        <span style={S.talentBadge}>🎫 {member.talent}</span>
      </div>
      <div style={{ ...S.card, background:"#e8f4ec", border:"1.5px solid #c8dfd0", marginBottom:16 }}>
        <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:700, color:"#1a3a2a" }}>{VERSE.ref} {done?"✓":""}</p>
        <p style={{ margin:0, fontSize:13, color:"#3a5a45", lineHeight:1.8 }}>{VERSE.text}</p>
      </div>
      <div style={S.card}>
        <p style={S.label}>말씀을 보지 않고 입력해보세요</p>
        <textarea style={S.textarea} placeholder="말씀을 입력하세요..." value={input} onChange={e => setInput(e.target.value)} rows={4} />
        <button style={S.btnPrimary} onClick={check}>제출</button>
        {result && (
          <div style={{ marginTop:12, padding:"10px 14px", borderRadius:10, background:result.correct?"#e8f8e8":"#fdecea", color:result.correct?"#2e7d32":"#c62828", fontSize:14 }}>
            {result.already?"이미 완료했어요 👍":result.correct?"🎉 정답! 달란트 20개 지급!":"❌ 다시 도전해보세요"}
          </div>
        )}
      </div>
    </div>
  );
}

function ClubPage({ nav }) {
  const clubs = [
    { emoji:"🏸", name:"배드민턴 동아리 (비트)", schedule:"매주 목요일 19:00 ~ 21:20", insta:null },
    { emoji:"💚", name:"봉사 동아리 (러빙유)",   schedule:"6/20(토) 주안역 일대 플로깅 13:00 ~ 15:00", insta:"https://www.instagram.com/luvu.turn?igsh=MTdrNHcwZDlkdGFsag==" },
    { emoji:"⚽", name:"축구 동아리 (참청FC)",   schedule:"한 달에 한두 번 풋살", insta:null },
    { emoji:"🏃", name:"러닝 동아리 (소닉)",     schedule:"격주 월요일 · 동구구민운동장 또는 인천대공원", insta:"https://www.instagram.com/sonic__run?igsh=dW04ZHR2MXdyM252&utm_source=qr" },
  ];
  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <button style={S.back} onClick={() => nav("bingo")}>← 빙고</button>
        <span style={S.topName}>🏃 동아리 소개</span>
        <span />
      </div>
      <div style={{ background:"#e8f4ec", border:"1.5px solid #c8dfd0", borderRadius:14, padding:"14px 16px", marginBottom:16, textAlign:"center" }}>
        <p style={{ margin:0, fontSize:13, color:"#3a5a45", lineHeight:1.8 }}>참여나 구체적인 일정 확인 원하시면<br/>담당 새가족 목자에게 연락주세요 😊</p>
        <p style={{ margin:"6px 0 0", fontSize:12, color:"#4a7c59", fontWeight:600 }}>각 동아리 팀장님들 연결해드릴게요!</p>
      </div>
      {clubs.map(club => (
        <div key={club.name} style={{ ...S.card, marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <span style={{ fontSize:28 }}>{club.emoji}</span>
            <b style={{ fontSize:15, color:"#1a3a2a" }}>{club.name}</b>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:"#f5faf7", borderRadius:10, marginBottom: club.insta ? 8 : 0 }}>
            <span style={{ fontSize:13 }}>📅</span>
            <p style={{ margin:0, fontSize:13, color:"#3a5a45", lineHeight:1.6 }}>{club.schedule}</p>
          </div>
          {club.insta && (
            <a href={club.insta} target="_blank" rel="noreferrer"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 12px", borderRadius:10, textDecoration:"none", fontWeight:700, fontSize:13, background:"linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", color:"#fff" }}>
              📸 인스타그램 보기
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function QtBoardPage({ member, qtPosts, setQtPosts, isAdmin, nav }) {
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedPost, setExpandedPost] = useState(null);
  const addComment = postId => {
    const text = (commentInputs[postId]||"").trim();
    if (!text) return;
    const post = qtPosts.find(p => p.id===postId);
    if (post) {
      const updated = { ...post, comments:[...(post.comments||[]), { id:Date.now(), author:member.name, text, date:new Date().toLocaleDateString("ko-KR") }] };
      fbSet("qtPosts/"+postId, updated);
    }
    setCommentInputs(prev => ({ ...prev, [postId]:"" }));
  };
  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <button style={S.back} onClick={() => nav("bingo")}>← 빙고</button>
        <span style={S.topName}>📖 큐티 인증</span>
        <span style={S.talentBadge}>🎫 {member.talent}</span>
      </div>
      <div style={{ background:"#e8f4ec", border:"1.5px solid #c8dfd0", borderRadius:14, padding:"14px 16px", marginBottom:16, textAlign:"center" }}>
        <p style={{ margin:"0 0 4px", fontSize:13, color:"#3a5a45", lineHeight:1.8 }}>말씀을 묵상하고 느낀 점에 대해서 댓글을 남겨주세요 🙏</p>
        <p style={{ margin:0, fontSize:12, color:"#4a7c59", fontWeight:600 }}>말씀은 매일 올라옵니다 · 당나귀 전까지 3번 인증하기!</p>
      </div>
      {qtPosts.length===0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#aaa" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📖</div>
          <p>아직 올라온 말씀이 없어요<br/>곧 말씀이 올라올 거예요!</p>
        </div>
      )}
      {qtPosts.map(post => (
        <div key={post.id} style={{ ...S.card, marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:11, color:"#aaa" }}>{post.date}</span>
            {isAdmin && <button style={{ background:"none", border:"none", color:"#e74c3c", fontSize:12, cursor:"pointer" }} onClick={() => setQtPosts(prev => prev.filter(p => p.id!==post.id))}>삭제</button>}
          </div>
          <p style={{ fontSize:14, color:"#1a3a2a", lineHeight:1.8, margin:"0 0 12px", whiteSpace:"pre-line" }}>{post.content}</p>
          <button style={{ background:"none", border:"none", color:"#4a7c59", fontSize:13, fontWeight:600, cursor:"pointer", padding:0, marginBottom:8 }}
            onClick={() => setExpandedPost(expandedPost===post.id?null:post.id)}>
            💬 댓글 {(post.comments||[]).length}개 {expandedPost===post.id?"▲":"▼"}
          </button>
          {expandedPost===post.id && (
            <div>
              {(post.comments||[]).length===0 && <p style={{ fontSize:12, color:"#aaa", textAlign:"center", padding:"8px 0" }}>첫 댓글을 남겨보세요 😊</p>}
              {(post.comments||[]).map(c => (
                <div key={c.id} style={{ background:"#f5f5f0", borderRadius:10, padding:"10px 12px", marginBottom:6 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:"#1a3a2a" }}>{c.author}</span>
                    <span style={{ fontSize:11, color:"#aaa" }}>{c.date}</span>
                  </div>
                  <p style={{ margin:0, fontSize:13, color:"#444", lineHeight:1.6 }}>{c.text}</p>
                </div>
              ))}
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                <input style={{ ...S.input, marginBottom:0, flex:1, fontSize:13 }} placeholder="묵상한 내용을 나눠주세요..."
                  value={commentInputs[post.id]||""} onChange={e => setCommentInputs(prev=>({...prev,[post.id]:e.target.value}))}
                  onKeyDown={e => e.key==="Enter"&&addComment(post.id)} />
                <button style={{ padding:"0 16px", background:"#4a7c59", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }} onClick={() => addComment(post.id)}>등록</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AdminPage({ members, setMembers, missions, setMissions, qtPosts, setQtPosts, nav }) {
  const [tab, setTab] = useState("attendance");
  const [editMissions, setEditMissions] = useState(missions.map(m=>({...m})));
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newPost, setNewPost] = useState("");

  const addTalent = (name,amt) => {
    const m = members.find(x => x.name===name);
    if (m) fbSet("members/"+safeName(name), { ...m, talent:Math.max(0,m.talent+amt) });
  };
  const confirmDelete = () => { set(ref(db,"members/"+safeName(deleteTarget)), null); setDeleteTarget(null); };
  const saveMissions = () => { fbSet("missions", editMissions.map(m=>({...m}))); alert("저장됐어요!"); };
  const addPost = () => {
    if (!newPost.trim()) return;
    const post = { id:Date.now(), date:new Date().toLocaleDateString("ko-KR"), content:newPost.trim(), comments:[] };
    fbSet("qtPosts/"+post.id, post);
    setNewPost("");
  };

  const TABS = [{id:"attendance",label:"출석체크"},{id:"missions",label:"미션관리"},{id:"talent",label:"달란트"},{id:"stats",label:"현황"},{id:"word",label:"말씀관리"}];

  return (
    <div style={S.page}>
      {deleteTarget && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <p style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>회원 삭제</p>
            <p style={{ fontSize:14, color:"#555", marginBottom:20 }}><b>{deleteTarget}</b> 님을 삭제할까요?<br/><span style={{ fontSize:12, color:"#aaa" }}>모든 데이터가 사라져요</span></p>
            <div style={{ display:"flex", gap:8 }}>
              <button style={{ ...S.btnPrimary, flex:1, background:"#e53935" }} onClick={confirmDelete}>삭제</button>
              <button style={{ ...S.btnGhost, flex:1 }} onClick={() => setDeleteTarget(null)}>취소</button>
            </div>
          </div>
        </div>
      )}
      <div style={S.topBar}>
        <button style={S.back} onClick={() => nav("home")}>← 홈</button>
        <span style={S.topName}>관리자 메뉴</span>
        <span />
      </div>
      <div style={S.tabRow}>
        {TABS.map(t => <button key={t.id} style={{ ...S.tab, ...(tab===t.id?S.tabActive:{}) }} onClick={()=>setTab(t.id)}>{t.label}</button>)}
      </div>

      {tab==="attendance" && (
        <div style={{ ...S.card, background:"#fff8e1", border:"1.5px solid #f9a825" }}>
          <p style={{ ...S.label, color:"#5d4037" }}>🫏 당나귀 빙고 참석자</p>
          <p style={{ fontSize:12, color:"#a1887f", marginBottom:10 }}>빙고판에서 당나귀 참석 칸을 인증한 멤버예요</p>
          {members.filter(m=>m.donkeyChecked).length===0
            ? <p style={{ fontSize:13, color:"#aaa", margin:0 }}>아직 없어요</p>
            : members.filter(m=>m.donkeyChecked).map(m => (
                <div key={m.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f0e0b0" }}>
                  <span style={{ fontSize:14, fontWeight:600, color:"#5d4037" }}>🫏 {m.name}</span>
                  <span style={{ fontSize:12, color:"#4a7c59", fontWeight:600 }}>✓ 빙고 인증 완료</span>
                </div>
              ))
          }
        </div>
      )}

      {tab==="missions" && (
        <div>
          <p style={{ fontSize:13, color:"#888", marginBottom:12 }}>미션 이름 및 달란트 편집</p>
          {editMissions.map((m,i) => (
            <div key={i} style={{ display:"flex", gap:6, marginBottom:8, alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#aaa", minWidth:20 }}>{i+1}</span>
              <input style={{ ...S.input, marginBottom:0, flex:2, fontSize:13 }} value={m.name} onChange={e=>{ const n=[...editMissions]; n[i]={...n[i],name:e.target.value}; setEditMissions(n); }} />
              <input style={{ ...S.input, marginBottom:0, width:60, fontSize:13, textAlign:"center" }} placeholder="달란트" type="number" value={m.talent??""} onChange={e=>{ const n=[...editMissions]; n[i]={...n[i],talent:e.target.value===""?null:Number(e.target.value)}; setEditMissions(n); }} />
            </div>
          ))}
          <button style={{ ...S.btnPrimary, marginTop:8 }} onClick={saveMissions}>저장하기</button>
        </div>
      )}

      {tab==="talent" && (
        <div>
          {members.length===0 && <p style={{ color:"#aaa", textAlign:"center" }}>등록된 새가족이 없어요</p>}
          {members.map(m => (
            <div key={m.name} style={S.memberRow}>
              <div><b style={{ fontSize:15 }}>{m.name}</b><p style={{ fontSize:12, color:"#aaa", margin:0 }}>🎫 {m.talent}개</p></div>
              <div style={{ display:"flex", gap:6 }}>
                <button style={S.btnSmall} onClick={()=>addTalent(m.name,10)}>+10</button>
                <button style={S.btnSmall} onClick={()=>addTalent(m.name,-10)}>-10</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="stats" && (
        <div>
          <div style={S.card}>
            <p style={S.label}>전체 현황</p>
            <div style={S.statsRow}><div style={S.stat}><b>{members.length}</b><span>총 인원</span></div></div>
          </div>
          <div style={{ ...S.card, marginBottom:16 }}>
            <p style={S.label}>🫏 당나귀 참석 여부</p>
            <div style={{ display:"flex", justifyContent:"space-around", marginBottom:12 }}>
              {[["참석 가능","#4a7c59"],["미정","#f57f17"],["참석 불가","#e53935"],["미응답","#aaa"]].map(([label,color]) => (
                <div key={label} style={{ textAlign:"center" }}>
                  <div style={{ fontWeight:700, color, fontSize:18 }}>{label==="미응답"?members.filter(m=>!m.rsvp).length:members.filter(m=>m.rsvp===label).length}</div>
                  <div style={{ color:"#888", fontSize:11 }}>{label}</div>
                </div>
              ))}
            </div>
            {members.map(m => (
              <div key={m.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f0f0f0" }}>
                <span style={{ fontSize:14, fontWeight:600 }}>{m.name}</span>
                <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:20, background:m.rsvp==="참석 가능"?"#e8f4ec":m.rsvp==="미정"?"#fff8e1":m.rsvp==="참석 불가"?"#fdecea":"#f5f5f0", color:m.rsvp==="참석 가능"?"#2e7d32":m.rsvp==="미정"?"#f57f17":m.rsvp==="참석 불가"?"#c62828":"#aaa" }}>
                  {m.rsvp||"미응답"}
                </span>
              </div>
            ))}
          </div>
          {[...members].sort((a,b)=>b.talent-a.talent).map((m,rank) => (
            <div key={m.name} style={S.memberRow}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:18, minWidth:28, textAlign:"center" }}>{rank===0?"🥇":rank===1?"🥈":rank===2?"🥉":`${rank+1}.`}</span>
                <div><b>{m.name}</b><p style={{ fontSize:12, color:"#aaa", margin:0 }}>빙고 {checkBingo(m.checked)}줄 · 암송 {m.verses?.length||0}</p></div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                <span style={{ fontWeight:700, color:"#c8a000" }}>🎫 {m.talent}</span>
                <button style={{ padding:"4px 10px", background:"#fdecea", color:"#c62828", border:"1px solid #f5c6cb", borderRadius:6, fontSize:12, cursor:"pointer", fontWeight:600 }} onClick={()=>setDeleteTarget(m.name)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="word" && (
        <div>
          <div style={S.card}>
            <p style={S.label}>📝 새 말씀 올리기</p>
            <textarea style={S.textarea} placeholder="오늘의 말씀을 입력하세요..." value={newPost} onChange={e=>setNewPost(e.target.value)} rows={4} />
            <button style={S.btnPrimary} onClick={addPost}>올리기</button>
          </div>
          {qtPosts.length>0 && (
            <div>
              <p style={{ ...S.label, marginBottom:12 }}>올라온 말씀 목록</p>
              {qtPosts.map(post => {
                const notCommented = members.filter(m => !(post.comments||[]).some(c=>c.author===m.name));
                return (
                  <div key={post.id} style={{ ...S.card, marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:11, color:"#aaa" }}>{post.date}</span>
                      <button style={{ background:"none", border:"none", color:"#e74c3c", fontSize:12, cursor:"pointer" }} onClick={()=>setQtPosts(prev=>prev.filter(p=>p.id!==post.id))}>삭제</button>
                    </div>
                    <p style={{ fontSize:13, color:"#1a3a2a", lineHeight:1.7, margin:"0 0 8px" }}>{post.content.slice(0,80)}{post.content.length>80?"...":""}</p>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:12, color:"#4a7c59", fontWeight:600 }}>💬 {(post.comments||[]).length}명 댓글</span>
                      {notCommented.length>0 && <span style={{ fontSize:12, color:"#e53935", fontWeight:600 }}>· 미응답 {notCommented.length}명: {notCommented.map(m=>m.name).join(", ")}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const S = {
  app:             { minHeight:"100vh", background:"linear-gradient(160deg,#f5f0e8,#e8f0e8)", fontFamily:"'Apple SD Gothic Neo','Noto Sans KR',sans-serif", display:"flex", justifyContent:"center" },
  container:       { width:"100%", maxWidth:480, minHeight:"100vh", background:"#fff", boxShadow:"0 0 40px rgba(0,0,0,0.08)" },
  page:            { padding:"0 16px 40px", overflowY:"auto" },
  header:          { textAlign:"center", padding:"40px 0 24px" },
  title:           { fontSize:28, fontWeight:800, color:"#1a3a2a", margin:"0 0 6px", letterSpacing:-0.5 },
  subtitle:        { fontSize:14, color:"#888", margin:0 },
  card:            { background:"#fafaf8", borderRadius:16, padding:"20px 16px", marginBottom:16, border:"1px solid #eee" },
  label:           { fontSize:13, fontWeight:600, color:"#555", marginBottom:8 },
  input:           { width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid #e0e0e0", fontSize:15, outline:"none", boxSizing:"border-box", marginBottom:12, background:"#fff" },
  textarea:        { width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid #e0e0e0", fontSize:14, outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.7, fontFamily:"inherit", background:"#fff" },
  btnPrimary:      { width:"100%", padding:"13px", background:"#4a7c59", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer" },
  btnGhost:        { padding:"10px 20px", background:"transparent", color:"#4a7c59", border:"1.5px solid #4a7c59", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" },
  btnSmall:        { padding:"6px 12px", background:"#eee", border:"none", borderRadius:8, fontSize:13, cursor:"pointer", fontWeight:600 },
  topBar:          { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 0 12px", borderBottom:"1px solid #f0f0f0", marginBottom:16, position:"sticky", top:0, background:"#fff", zIndex:10 },
  back:            { background:"none", border:"none", color:"#4a7c59", fontSize:14, fontWeight:600, cursor:"pointer", padding:"4px 0" },
  topName:         { fontSize:16, fontWeight:700, color:"#1a3a2a" },
  talentBadge:     { fontSize:14, fontWeight:700, color:"#c8a000", background:"#fffae0", padding:"4px 10px", borderRadius:20 },
  statsRow:        { display:"flex", gap:12, marginBottom:16, justifyContent:"center" },
  stat:            { display:"flex", flexDirection:"column", alignItems:"center", background:"#f5faf7", borderRadius:12, padding:"12px 20px", minWidth:80 },
  bingoGrid:       { display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:3, marginBottom:16 },
  bingoCell:       { aspectRatio:"1", background:"#f5f5f0", border:"1.5px solid #e8e8e0", borderRadius:8, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2px 1px", position:"relative", transition:"all 0.15s", gap:1, overflow:"hidden" },
  bingoCellDone:   { background:"#d4edda", border:"1.5px solid #4a7c59" },
  checkMark:       { position:"absolute", top:2, right:4, fontSize:9, color:"#4a7c59", fontWeight:800 },
  cellName:        { fontSize:10, textAlign:"center", lineHeight:1.25, color:"#333", wordBreak:"keep-all", whiteSpace:"pre-line", fontWeight:600, padding:"0 1px" },
  cellTalent:      { fontSize:9, fontWeight:700, color:"#c8a000", background:"#fffae0", borderRadius:4, padding:"1px 3px", marginTop:1, lineHeight:1.2 },
  cellTalentHidden:{ color:"#aaa", background:"#f0f0f0" },
  bingoBanner:     { background:"linear-gradient(135deg,#4a7c59,#2e5f3f)", color:"#fff", borderRadius:14, padding:"14px 20px", textAlign:"center", fontWeight:700, fontSize:15, marginBottom:16 },
  overlay:         { position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" },
  modal:           { background:"#fff", borderRadius:20, padding:"24px 20px", width:"85%", maxWidth:340, boxShadow:"0 8px 40px rgba(0,0,0,0.18)" },
  tabRow:          { display:"flex", gap:6, marginBottom:20, overflowX:"auto" },
  tab:             { padding:"8px 16px", background:"#f0f0ec", border:"none", borderRadius:20, fontSize:13, fontWeight:600, cursor:"pointer", color:"#666", whiteSpace:"nowrap" },
  tabActive:       { background:"#4a7c59", color:"#fff" },
  memberRow:       { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:"#fafaf8", borderRadius:12, marginBottom:8, border:"1px solid #eee" },
};

