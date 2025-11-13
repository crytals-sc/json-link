; Loop.asm 
; Loop 3 times, each time accept 2 integers and print their sum

include \masm32\include\masm32rt.inc

; Prototype the sum function
sum PROTO :DWORD, :DWORD

.code
start:
    call main
    exit

main PROC
    LOCAL var1:DWORD
    LOCAL var2:DWORD
    LOCAL result:DWORD
    LOCAL COUNT:DWORD

    mov COUNT, 3
    print chr$("Program will compute sum of 2 integers ")
    print str$(COUNT)
    print chr$(" times", 13,10)

CONTD:
    CMP COUNT, 0
    je STOP

    print chr$("Time ")
    mov eax, 4
    sub eax, COUNT
    print str$(eax)
    print chr$(": ", 13,10)

    mov var1, sval(input("Enter number 1: "))
    mov var2, sval(input("Enter number 2: "))

    invoke sum, var1, var2
    mov result, eax

    print chr$("Sum of them: ")
    print str$(result)
    print chr$(13,10)

    dec COUNT
    jmp CONTD

STOP:
    ret
main ENDP

sum PROC v1:DWORD, v2:DWORD
    mov eax, v1
    add eax, v2
    ret
sum ENDP

end start
