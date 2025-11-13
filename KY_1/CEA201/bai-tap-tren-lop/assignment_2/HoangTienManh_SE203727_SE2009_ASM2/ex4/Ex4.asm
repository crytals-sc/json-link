; Ex4.asm - Solve ax + b = 0
include \masm32\include\masm32rt.inc

.code
start:
    call main
    exit

; ---------------------- MAIN ----------------------
main proc
    LOCAL aVal:DWORD
    LOCAL bVal:DWORD
    LOCAL xVal:DWORD

    ; Input a and b
    mov aVal, sval(input("Enter a: "))
    mov bVal, sval(input("Enter b: "))

    ; Check if a = 0
    mov eax, aVal
    cmp eax, 0
    je a_is_zero

    ; Compute x = -b / a
    mov eax, bVal
    neg eax            ; eax = -b
    cdq
    idiv aVal          ; eax = -b / a
    mov xVal, eax

    print chr$("Equation: ax + b = 0",13,10)
    print chr$("=> x = ")
    print str$(xVal)
    print chr$(13,10)
    jmp done

a_is_zero:
    print chr$("a = 0, equation has no solution (or infinite solutions)",13,10)

done:
    ret
main endp

end start