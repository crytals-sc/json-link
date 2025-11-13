; factorial.asm - Compute n! using a procedure
include \masm32\include\masm32rt.inc

; Prototype
factorial PROTO :DWORD

.code
start:
    call main
    exit

; -------------------- MAIN --------------------
main PROC
    LOCAL n:DWORD
    LOCAL result:DWORD

    ; Input n
    mov n, sval(input("Enter n: "))

    ; Call factorial procedure
    invoke factorial, n
    mov result, eax          ; returned value in EAX

    ; Print result
    print chr$("n! = ")
    print str$(result)
    print chr$(13,10)

    ret
main ENDP

; -------------------- FACTORIAL --------------------
; factorial PROC n:DWORD
;   returns factorial(n) in EAX
; -----------------------------------------------
factorial PROC n:DWORD
    mov eax, 1            ; result = 1
    mov ecx, n            ; ecx = n
    cmp ecx, 1
    jbe done              ; if n <= 1 ? return 1

loop_start:
    mul ecx               ; eax = eax * ecx
    loop loop_start       ; decrement ecx and continue until 0
done:
    ret
factorial ENDP

end start
