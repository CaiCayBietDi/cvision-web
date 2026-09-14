
/* =========================================
   WORKFLOW 3D - TIMELINE SYNC AUDIO
   ========================================= */
const Workflow3D = (function() {
    let currentScene = 0;
    let audios = {};
    const totalScenes = 5; // 0=Intro, 1=Ph1, 2=Ph2, 3=Ph3, 4=Ph4, 5=Ending
    let isPlaying = false;
    
    function lockScroll(e) { e.preventDefault(); }

    function init() {
        audios[1] = new Audio('assets/audio/phase1.mp3');
        audios[2] = new Audio('assets/audio/phase2.mp3');
        audios[3] = new Audio('assets/audio/phase3.mp3');
        audios[4] = new Audio('assets/audio/phase4.mp3');
        audios[5] = new Audio('assets/audio/ending.mp3');
        
        document.getElementById('wf-btn-start').addEventListener('click', () => {
            // Trigger exit animation for Intro
            document.getElementById('wf-scene-0').classList.remove('active');
            document.getElementById('wf-scene-0').classList.add('exit');
            setTimeout(() => goToScene(1), 800);
        });
        
        // Audio chains
        audios[1].addEventListener('ended', () => transitionScene(1, 2));
        
        audios[2].addEventListener('timeupdate', (e) => {
            // Blackbox lock triggers near the end of phase 2 audio (when mentioning "bảo mật")
            const a = e.target;
            if(a.currentTime / a.duration > 0.8) {
                document.getElementById('wf-scene-2').classList.add('locked');
            }
        });
        audios[2].addEventListener('ended', () => transitionScene(2, 3));
        
        audios[3].addEventListener('ended', () => transitionScene(3, 4));
        
        audios[4].addEventListener('timeupdate', (e) => {
            // Notification ping triggers in the middle
            if(e.target.currentTime > 5 && !document.getElementById('wf-phone-ping').classList.contains('pinged')) {
                document.getElementById('wf-phone-ping').classList.add('pinged');
                document.getElementById('wf-phone-ping').style.opacity = '1';
                document.getElementById('wf-phone-ping').style.transform = 'scale(1) translateZ(200px)';
            }
        });
        audios[4].addEventListener('ended', () => transitionScene(4, 5));
    }
    
    function transitionScene(from, to) {
        document.getElementById('wf-scene-'+from).classList.remove('active');
        document.getElementById('wf-scene-'+from).classList.add('exit'); // fly through
        setTimeout(() => goToScene(to), 600); // overlap start
    }
    
    function openModal() {
        document.getElementById('wf-3d-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
        document.addEventListener('wheel', lockScroll, {passive: false});
        document.addEventListener('touchmove', lockScroll, {passive: false});
        
        // Reset all
        for(let i=0; i<=5; i++) {
            let s = document.getElementById('wf-scene-'+i);
            if(s) {
                s.classList.remove('active', 'exit', 'locked');
            }
        }
        document.getElementById('wf-phone-ping').classList.remove('pinged');
        document.getElementById('wf-phone-ping').style.opacity = '0';
        document.getElementById('wf-phone-ping').style.transform = 'scale(0)';
        
        goToScene(0);
    }
    
    function closeModal() {
        document.getElementById('wf-3d-modal').classList.remove('active');
        document.body.style.overflow = '';
        document.removeEventListener('wheel', lockScroll);
        document.removeEventListener('touchmove', lockScroll);
        Object.values(audios).forEach(a => { a.pause(); a.currentTime = 0; });
        isPlaying = false;
    }
    
    function goToScene(index) {
        const scene = document.getElementById('wf-scene-' + index);
        if(scene) scene.classList.add('active');
        if(audios[index]) audios[index].play();
        currentScene = index;
    }
    
    return { init, openModal, closeModal };
})();

// Attach to window so HTML can trigger it
window.openWorkflowModal = (e) => {
    if(e) e.preventDefault();
    Workflow3D.openModal();
};

document.addEventListener('DOMContentLoaded', Workflow3D.init);
