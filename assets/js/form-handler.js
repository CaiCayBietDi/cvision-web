/**
 * =========================================================================
 * CVISION AI - CẤU HÌNH & XỬ LÝ GỬI FORM VỀ EMAIL (WEB3FORMS)
 * =========================================================================
 * Khi cần thay đổi Token / Access Key Web3Forms, bạn chỉ cần sửa giá trị
 * duy nhất tại biến WEB3FORMS_ACCESS_KEY bên dưới.
 * Đăng ký hoặc lấy token mới miễn phí tại: https://web3forms.com/
 */
const CVISION_CONFIG = {
  WEB3FORMS_ACCESS_KEY: "f20353d4-2279-48c0-9bd5-40ecb443081e"
};

(function () {
  // Hàm hiển thị Toast thông báo thành công
  function showSuccessToast(message) {
    let toast = document.getElementById('success-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'success-toast';
      toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 glass-card px-8 py-4 rounded-xl flex items-center gap-3 z-[100] translate-y-20 opacity-0 transition-all duration-500 shadow-2xl border border-primary-container/30 bg-[#181a2d]/95 text-white';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="material-symbols-outlined text-primary-container">check_circle</span><span class="text-white font-semibold">${message || 'Đã gửi yêu cầu thành công! Chúng tôi sẽ sớm liên hệ.'}</span>`;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 5000);
  }

  // Hàm khởi tạo xử lý form
  function initForms() {
    // 1. Xử lý Form Liên hệ chi tiết (lien-he.html - id: contact-form)
    const contactForm = document.getElementById('contact-form');
    if (contactForm && !contactForm.dataset.bound) {
      contactForm.dataset.bound = 'true';
      contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]') || contactForm.querySelector('button');
        const originalHtml = submitBtn ? submitBtn.innerHTML : 'Gửi yêu cầu';
        if (submitBtn) {
          submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">autorenew</span> Đang gửi...';
          submitBtn.disabled = true;
        }

        const name = document.getElementById('field-name')?.value?.trim() || '';
        const email = document.getElementById('field-email')?.value?.trim() || '';
        const phone = document.getElementById('field-phone')?.value?.trim() || '';
        const position = document.getElementById('field-position')?.value?.trim() || '';
        const company = document.getElementById('field-company')?.value?.trim() || '';
        const interest = document.getElementById('field-interest')?.value || '';
        const message = document.getElementById('field-message')?.value?.trim() || '';

        try {
          const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              access_key: CVISION_CONFIG.WEB3FORMS_ACCESS_KEY,
              subject: `[Tư vấn CvisionAI] Yêu cầu từ ${name}${company ? ' - ' + company : ''}`,
              from_name: name,
              email: email,
              phone: phone,
              position: position,
              company: company,
              interest: interest,
              message: message
            })
          });

          const result = await response.json();
          if (response.status === 200) {
            showSuccessToast('Đã gửi yêu cầu thành công! Chúng tôi sẽ sớm liên hệ.');
            contactForm.reset();
          } else {
            alert('Có lỗi xảy ra: ' + (result.message || 'Vui lòng kiểm tra lại thông tin.'));
          }
        } catch (error) {
          alert('Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.');
        } finally {
          if (submitBtn) {
            submitBtn.innerHTML = originalHtml;
            submitBtn.disabled = false;
          }
        }
      });
    }

    // 2. Xử lý Form Demo Request & các Form còn lại (Trang giải pháp, contact_section, demoRequestForm, v.v.)
    const allForms = document.querySelectorAll('form');
    allForms.forEach(form => {
      // Bỏ qua form contact-form đã xử lý ở trên
      if (form.id === 'contact-form' || form.dataset.bound) return;

      // Nhận diện form demo hoặc form liên hệ chính
      const isDemoOrContact =
        form.id === 'demoRequestForm' ||
        form.id === 'contactForm' ||
        form.querySelector('input[name="form_type"]') ||
        form.querySelector('input[name="solution_name"]') ||
        form.querySelector('input[name="name"]');

      if (!isDemoOrContact) return; // Bỏ qua form newsletter tìm kiếm footer

      form.dataset.bound = 'true';
      form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');
        const originalHtml = submitBtn ? submitBtn.innerHTML : 'Gửi yêu cầu';
        if (submitBtn) {
          submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">autorenew</span> Đang gửi...';
          submitBtn.disabled = true;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        data.access_key = CVISION_CONFIG.WEB3FORMS_ACCESS_KEY;
        const name = data.name || 'Khách hàng';
        const company = data.company || '';
        const solution = data.solution_name || '';
        const formType = data.form_type || (form.id === 'contactForm' ? 'Liên hệ' : 'Demo Request');

        data.subject = `[${formType}] ${name}${company ? ' - ' + company : ''}${solution ? ' (' + solution + ')' : ''}`;
        data.from_name = name;

        try {
          const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(data)
          });

          const result = await response.json();
          if (response.status === 200) {
            showSuccessToast('Đã gửi yêu cầu thành công! Chúng tôi sẽ sớm liên hệ.');
            form.reset();
          } else {
            alert('Có lỗi xảy ra: ' + (result.message || 'Vui lòng kiểm tra lại thông tin.'));
          }
        } catch (error) {
          alert('Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.');
        } finally {
          if (submitBtn) {
            submitBtn.innerHTML = originalHtml;
            submitBtn.disabled = false;
          }
        }
      });
    });
  }

  // Chạy khi DOM đã sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
})();
