(function(root){
 function check(value){const password=String(value||'');return{length:password.length>=8,case:/[a-z]/.test(password)&&/[A-Z]/.test(password),number:/\d/.test(password),special:/[!@#$%^&*(),.?":{}|<>]/.test(password)};}
 const api={check,isStrong:value=>Object.values(check(value)).every(Boolean)};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PasswordPolicy=api;
})(typeof window==='undefined'?globalThis:window);
