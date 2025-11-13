; EX06_Sum.asm   Accept 2 integers, sum of them will be printed out
include \masm32\include\masm32rt.inc 
sum PROTO :DWORD, :DWORD       ;  prototype a method + 2 parameters    
.code                       
start:                          ; The CODE entry point of the program
    call main                   ; branch to the "main" procedure
    exit
; ллллллллллллллллллллллллллллллллллллллллллллллллллллллл
main proc
    LOCAL var1:DWORD            ; 2 DWORD integral variables
    LOCAL var2:DWORD            ; 
    LOCAL result:DWORD          ; Result of operation 
  ; Input 2 integers
    mov var1, sval(input("Enter number 1 : "))
    mov var2, sval(input("Enter number 2 : "))   
  ; Invoke the procedure SUM to compute their sum, result in EAX
    push eax                             ; store EAX to STACK
    invoke sum, var1 , var2
    mov result, eax                  ; result = EAX
    pop eax                              ; restore EAX from STACK   

 ; Print the result
    print chr$("Sum of them:")
    print str$(result)    

    ret
main endp
; лллллллллллллллллллллллллллл
sum proc v1: DWORD, v2:DWORD
   mov eax, v1          ; eax= v1
   add eax, v2           ; eax = eax + v2 -> Result in eax
   ret
sum endp

end start 
