; Swap1.asm – Accept 2 integers, swap them, print results
include \masm32\include\masm32rt.inc
swap1 PROTO :DWORD, :DWORD    ; prototype the procedure swap1

.code
start:
    call main
    exit

; ================================
main PROC
    LOCAL var1:DWORD      ; integral variable
    LOCAL pVar1:DWORD     ; address of var1
    LOCAL var2:DWORD      ; integral variable
    LOCAL pVar2:DWORD     ; address of var2

    ; Input 2 integers
    mov var1, sval(input("Enter number 1 : "))
    mov var2, sval(input("Enter number 2 : "))

    ; Get addresses of var1, var2 to pVar1, pVar2
    lea eax, var1
    mov pVar1, eax
    lea eax, var2
    mov pVar2, eax

    ; Output info of var1, var2
    print chr$("var1, address:")
    print str$(pVar1)
    print chr$(", value:")
    print str$(var1)
    print chr$(13,10)

    print chr$("var2, address:")
    print str$(pVar2)
    print chr$(", value:")
    print str$(var2)
    print chr$(13,10)

    ; Invoke procedure SWAP1 to swap 2 values
    push eax              ; store EAX to STACK
    push ebx              ; store EBX to STACK
    invoke swap1, var1, var2
    pop ebx               ; restore EBX
    pop eax               ; restore EAX

    ; Print result
    print chr$("After swapping:")
    print str$(var1)
    print chr$(", ")
    print str$(var2)
    print chr$(13,10)
    ret
main ENDP
; ================================

; ================================

swap1 PROC v1:DWORD, v2:DWORD
    ; Print out info of arguments
    print chr$("Argument 1, address:")
    lea eax, v1
    print str$(eax)
    print chr$(", value:")
    print str$(v1)
    print chr$(13,10)

    print chr$("Argument 2, address:")
    lea eax, v2
    print str$(eax)
    print chr$(", value:")
    print str$(v2)
    print chr$(13,10)

    ; Swap values (this does NOT change caller’s variables)
    mov eax, v1
    mov ebx, v2
    mov v1, ebx
    mov v2, eax
    ret
swap1 ENDP

END start


